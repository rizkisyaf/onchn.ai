import { BehaviorModel } from '@/lib/ai/behavior-model'
import { WalletState } from '@/types/wallet'

jest.mock('@tensorflow/tfjs-node', () => ({
  sequential: jest.fn(() => ({
    add: jest.fn(),
    compile: jest.fn(),
    fit: jest.fn(),
    predict: jest.fn(() => ({
      dataSync: () => [0.8, 0.1, 0.1],
    })),
  })),
  layers: {
    dense: jest.fn(() => ({
      apply: jest.fn(),
    })),
  },
  train: {
    adam: jest.fn(),
  },
  tensor2d: jest.fn(() => ({
    dataSync: () => [0.8, 0.1, 0.1],
  })),
}))

describe('BehaviorModel', () => {
  let model: BehaviorModel

  beforeEach(() => {
    model = new BehaviorModel()
  })

  it('should predict trade actions', async () => {
    const state = {
      transactionCount: 100,
      uniqueTokens: 5,
      avgTransactionValue: 1000,
      tradeFrequency: 0.5,
      profitRatio: 1.2,
      riskLevel: 0.3,
      timeInMarket: 180,
      totalInflow: 5000,
      totalOutflow: 4000,
      lastActivity: Date.now(),
      tokens: [],
      stats: {
        totalValue: 1000,
        totalTransactions: 100,
        uniqueTokens: 5,
        avgTransactionValue: 1000,
        lastActivity: Date.now()
      }
    } as WalletState

    const action = await model.predict(state)
    expect(['buy', 'sell', 'hold']).toContain(action.type)
    expect(action.token).toBeDefined()
    expect(action.amount).toBeGreaterThan(0)
    expect(action.confidence).toBeGreaterThan(0)
  })

  it('should train on examples', async () => {
    const state = {
      transactionCount: 100,
      uniqueTokens: 5,
      avgTransactionValue: 1000,
      tradeFrequency: 0.5,
      profitRatio: 1.2,
      riskLevel: 0.3,
      timeInMarket: 180,
      totalInflow: 5000,
      totalOutflow: 4000,
      lastActivity: Date.now(),
      tokens: [],
      stats: {
        totalValue: 1000,
        totalTransactions: 100,
        uniqueTokens: 5,
        avgTransactionValue: 1000,
        lastActivity: Date.now()
      }
    } as WalletState

    const examples = [{
      state,
      action: {
        type: 'buy' as const,
        token: 'SOL',
        amount: 1.0,
        confidence: 0.8,
      },
      reward: 1.0,
    }]

    await model.train(examples)
    expect(model.getTrainingProgress()).toBe(1)
  })
}) 