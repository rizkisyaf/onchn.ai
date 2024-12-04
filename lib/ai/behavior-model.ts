import * as tf from '@tensorflow/tfjs'
import { WalletState } from '@/types/wallet'

export interface TradeAction {
  type: 'buy' | 'sell' | 'hold'
  token: string
  amount: number
  confidence: number
}

export interface TrainingExample {
  state: WalletState
  action: TradeAction
  reward: number
}

export class BehaviorModel {
  private model: tf.Sequential | tf.LayersModel
  private trainingProgress: number = 0

  constructor() {
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({ units: 64, activation: 'relu', inputShape: [7] }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 3, activation: 'softmax' })
      ]
    })

    this.model.compile({
      optimizer: tf.train.adam(),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
    })
  }

  private normalizeState(state: WalletState): number[] {
    return [
      state.transactionCount / 1000, // Normalize to [0, 1]
      state.uniqueTokens / 100,
      state.avgTransactionValue / 10000,
      state.tradeFrequency,
      state.profitRatio,
      state.riskLevel,
      state.timeInMarket / 365,
    ]
  }

  async predict(state: WalletState): Promise<TradeAction> {
    const normalizedState = this.normalizeState(state)
    const stateTensor = tf.tensor2d([normalizedState])
    const prediction = this.model.predict(stateTensor) as tf.Tensor
    const probabilities = await prediction.data()

    // Cleanup tensors
    stateTensor.dispose()
    prediction.dispose()

    // Convert probabilities to action
    const actionIndex = probabilities.indexOf(Math.max(...probabilities))
    const actionTypes: ('buy' | 'sell' | 'hold')[] = ['buy', 'sell', 'hold']

    return {
      type: actionTypes[actionIndex],
      token: 'SOL', // Default to SOL for now
      amount: 1.0, // Default amount
      confidence: probabilities[actionIndex],
    }
  }

  async train(examples: TrainingExample[]): Promise<void> {
    if (examples.length === 0) return

    const states = examples.map(ex => this.normalizeState(ex.state))
    const actions = examples.map(ex => {
      const actionTypes: ('buy' | 'sell' | 'hold')[] = ['buy', 'sell', 'hold']
      const actionIndex = actionTypes.indexOf(ex.action.type)
      return [actionIndex === 0 ? 1 : 0, actionIndex === 1 ? 1 : 0, actionIndex === 2 ? 1 : 0]
    })

    const statesTensor = tf.tensor2d(states)
    const actionsTensor = tf.tensor2d(actions)

    this.trainingProgress = 0

    await this.model.fit(statesTensor, actionsTensor, {
      epochs: 10,
      batchSize: 32,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, _logs) => {
          this.trainingProgress = (epoch + 1) / 10
        },
        onTrainEnd: () => {
          this.trainingProgress = 1
        },
      },
    })

    statesTensor.dispose()
    actionsTensor.dispose()
    this.trainingProgress = 1
  }

  getTrainingProgress(): number {
    return this.trainingProgress
  }

  async save(): Promise<void> {
    await this.model.save('localstorage://wallet-behavior-model')
  }

  async load(): Promise<void> {
    const loadedModel = await tf.loadLayersModel('localstorage://wallet-behavior-model')
    if (loadedModel instanceof tf.Sequential || loadedModel instanceof tf.LayersModel) {
      this.model = loadedModel
    } else {
      throw new Error('Invalid model format')
    }
  }
}

export type { WalletState }
