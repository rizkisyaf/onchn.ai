import { BehaviorModel } from '@/lib/ai/behavior-model'
import { AutoTrader } from '@/lib/trading/auto-trader'
import { JupiterClient } from '@/lib/trading/jupiter-client'
import { Connection, PublicKey } from '@solana/web3.js'

jest.mock('@/lib/trading/jupiter-client')
jest.mock('@/lib/ai/behavior-model')

describe('AutoTrader', () => {
  let autoTrader: AutoTrader
  let mockJupiterClient: jest.Mocked<JupiterClient>
  let mockBehaviorModel: jest.Mocked<BehaviorModel>
  let mockConnection: Connection

  beforeEach(() => {
    mockConnection = new Connection('http://localhost:8899')
    const userPublicKey = new PublicKey('11111111111111111111111111111111')

    mockJupiterClient = new JupiterClient(mockConnection, userPublicKey) as jest.Mocked<JupiterClient>
    mockBehaviorModel = new BehaviorModel() as jest.Mocked<BehaviorModel>

    autoTrader = new AutoTrader(mockConnection, userPublicKey)
    autoTrader['jupiterClient'] = mockJupiterClient
    autoTrader['behaviorModel'] = mockBehaviorModel
  })

  test('should execute trades based on model predictions', async () => {
    const mockState = {
      transactionCount: 100,
      uniqueTokens: 5,
      avgTransactionValue: 1000,
      tradeFrequency: 0.5,
      profitRatio: 1.2,
      riskLevel: 0.3,
      timeInMarket: 180,
    }

    const mockPrediction = {
      type: 'buy' as const,
      token: 'SOL',
      amount: 1.0,
      confidence: 0.9,
    }

    mockBehaviorModel.predict.mockResolvedValue(mockPrediction)

    mockJupiterClient.getBestRoute.mockResolvedValue({
      routeInfo: {} as any,
      outAmount: 1.0,
      fee: 0.001,
      priceImpact: 0.001,
    })

    mockJupiterClient.executeSwap.mockResolvedValue('mock-transaction-signature')

    const result = await autoTrader.executeTradeStrategy({
      walletAddress: '11111111111111111111111111111111',
      maxAmount: 1,
      slippage: 0.01,
    })

    expect(result).toEqual({
      success: true,
      txid: 'mock-transaction-signature',
      action: 'buy',
      token: 'SOL',
      amount: 1.0,
      confidence: 0.9,
    })

    expect(mockBehaviorModel.predict).toHaveBeenCalledWith(mockState)
    expect(mockJupiterClient.getBestRoute).toHaveBeenCalled()
    expect(mockJupiterClient.executeSwap).toHaveBeenCalled()
  })

  test('should handle trade execution errors', async () => {
    const mockState = {
      transactionCount: 100,
      uniqueTokens: 5,
      avgTransactionValue: 1000,
      tradeFrequency: 0.5,
      profitRatio: 1.2,
      riskLevel: 0.3,
      timeInMarket: 180,
    }

    mockBehaviorModel.predict.mockResolvedValue({
      type: 'buy',
      token: 'SOL',
      amount: 1.0,
      confidence: 0.9,
    })

    mockJupiterClient.getBestRoute.mockRejectedValue(new Error('No route found'))

    const result = await autoTrader.executeTradeStrategy({
      walletAddress: '11111111111111111111111111111111',
      maxAmount: 1,
      slippage: 0.01,
    })

    expect(result).toEqual({
      success: false,
      error: 'No route found',
    })

    expect(mockBehaviorModel.predict).toHaveBeenCalledWith(mockState)
    expect(mockJupiterClient.getBestRoute).toHaveBeenCalled()
    expect(mockJupiterClient.executeSwap).not.toHaveBeenCalled()
  })
}) 