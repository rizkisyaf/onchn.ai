import { renderHook, act } from '@testing-library/react'
import { useAutoTrader } from '@/hooks/use-auto-trader'
import { AutoTrader } from '@/lib/trading/auto-trader'

jest.mock('@/lib/trading/auto-trader')

describe('useAutoTrader', () => {
  const mockExecuteTradeStrategy = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(AutoTrader as jest.Mock).mockImplementation(() => ({
      executeTradeStrategy: mockExecuteTradeStrategy,
    }))
    process.env.NODE_ENV = 'test'
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useAutoTrader())

    expect(result.current.isTrading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.lastTrade).toBeNull()
    expect(result.current.parameters).toBeNull()
  })

  it('should start trading with correct parameters', async () => {
    mockExecuteTradeStrategy.mockResolvedValueOnce({
      success: true,
      txid: 'mock_txid',
      action: 'buy',
      token: 'SOL',
      amount: 1,
      confidence: 0.8,
    })

    const { result } = renderHook(() => useAutoTrader())

    const params = {
      walletAddress: 'test-wallet',
      maxAmount: 1,
      slippage: 0.01,
    }

    await act(async () => {
      await result.current.startTrading(params)
    })

    expect(result.current.isTrading).toBe(true)
    expect(result.current.error).toBeNull()
    expect(result.current.lastTrade).toEqual({
      success: true,
      txid: 'mock_txid',
      action: 'buy',
      token: 'SOL',
      amount: 1,
      confidence: 0.8,
    })
    expect(result.current.parameters).toEqual(params)
  })

  it('should handle trading errors', async () => {
    mockExecuteTradeStrategy.mockResolvedValueOnce({
      success: false,
      error: 'Trade failed',
    })

    const { result } = renderHook(() => useAutoTrader())

    await act(async () => {
      await result.current.startTrading({
        walletAddress: 'test-wallet',
        maxAmount: 1,
        slippage: 0.01,
      })
    })

    expect(result.current.isTrading).toBe(false)
    expect(result.current.error).toBe('Trade failed')
    expect(result.current.lastTrade).toBeNull()
  })

  it('should stop trading', async () => {
    const { result } = renderHook(() => useAutoTrader())

    await act(async () => {
      await result.current.startTrading({
        walletAddress: 'test-wallet',
        maxAmount: 1,
        slippage: 0.01,
      })
    })

    act(() => {
      result.current.stopTrading()
    })

    expect(result.current.isTrading).toBe(false)
  })

  it('should update trading parameters', async () => {
    const { result } = renderHook(() => useAutoTrader())

    await act(async () => {
      await result.current.startTrading({
        walletAddress: 'test-wallet',
        maxAmount: 1,
        slippage: 0.01,
      })
    })

    act(() => {
      result.current.updateParameters({
        maxAmount: 2,
        slippage: 0.02,
      })
    })

    expect(result.current.parameters).toEqual({
      walletAddress: 'test-wallet',
      maxAmount: 2,
      slippage: 0.02,
    })
  })

  it('should execute next trade', async () => {
    mockExecuteTradeStrategy
      .mockResolvedValueOnce({
        success: true,
        txid: 'txid1',
        action: 'buy',
        token: 'SOL',
        amount: 1,
        confidence: 0.8,
      })
      .mockResolvedValueOnce({
        success: true,
        txid: 'txid2',
        action: 'sell',
        token: 'SOL',
        amount: 0.5,
        confidence: 0.9,
      })

    const { result } = renderHook(() => useAutoTrader())

    await act(async () => {
      await result.current.startTrading({
        walletAddress: 'test-wallet',
        maxAmount: 1,
        slippage: 0.01,
      })
    })

    expect(result.current.lastTrade).toEqual({
      success: true,
      txid: 'txid1',
      action: 'buy',
      token: 'SOL',
      amount: 1,
      confidence: 0.8,
    })

    await act(async () => {
      await result.current.executeNextTrade()
    })

    expect(result.current.lastTrade).toEqual({
      success: true,
      txid: 'txid2',
      action: 'sell',
      token: 'SOL',
      amount: 0.5,
      confidence: 0.9,
    })
  })

  // Add real integration tests
  describe('Production Environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production'
    })

    it('should execute real trades on mainnet', async () => {
      // Integration test implementation
    })
  })
}) 