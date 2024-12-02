import { BehaviorModel, WalletState, TrainingExample } from '@/lib/ai/behavior-model'

describe('BehaviorModel', () => {
  let model: BehaviorModel

  beforeEach(() => {
    model = new BehaviorModel()
  })

  test('should predict trade actions', async () => {
    const state: WalletState = {
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
    }

    const action = await model.predict(state)
    expect(action).toHaveProperty('type')
    expect(action).toHaveProperty('token')
    expect(action).toHaveProperty('amount')
    expect(action).toHaveProperty('confidence')
  })

  test('should train on examples', async () => {
    const examples: TrainingExample[] = [
      {
        state: {
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
        },
        action: {
          type: 'buy',
          token: 'SOL',
          amount: 1.0,
          confidence: 0.8,
        },
        reward: 1.0,
      },
    ]

    await model.train(examples)
    expect(model.getTrainingProgress()).toBe(1)
  })
}) 