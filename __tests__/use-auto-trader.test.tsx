import { renderHook, act } from '@testing-library/react'
import { useAutoTrader } from '@/hooks/use-auto-trader'
import { AutoTrader } from '@/lib/trading/auto-trader'
import { createWrapper } from '@/test/test-utils'

jest.mock('@/lib/trading/auto-trader')

describe('useAutoTrader', () => {
  const mockExecuteTradeStrategy = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(AutoTrader as jest.Mock).mockImplementation(() => ({
      executeTradeStrategy: mockExecuteTradeStrategy,
      init: () => Promise.resolve(),
    }))
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'test' })
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useAutoTrader(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isTrading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.lastTrade).toBeNull()
    expect(result.current.parameters).toBeNull()
  })

  it('should start trading with correct parameters', async () => {
    mockExecuteTradeStrategy.mockResolvedValueOnce({
      success: true,
      txid: 'mock-tx',
      action: 'buy',
      token: 'SOL',
      amount: 1,
      confidence: 0.9,
    })

    const { result } = renderHook(() => useAutoTrader(), {
      wrapper: createWrapper(),
    })

    const params = {
      walletAddress: 'mock-wallet',
      maxAmount: 100,
      slippage: 0.01,
    }

    await act(async () => {
      await result.current.startTrading(params)
    })

    expect(result.current.isTrading).toBe(true)
    expect(result.current.parameters).toEqual(params)
    expect(mockExecuteTradeStrategy).toHaveBeenCalledWith(params)
  })

  it('should handle trading errors', async () => {
    mockExecuteTradeStrategy.mockRejectedValueOnce(new Error('Test error'))

    const { result } = renderHook(() => useAutoTrader(), {
      wrapper: createWrapper(),
    })

    const params = {
      walletAddress: 'mock-wallet',
      maxAmount: 100,
      slippage: 0.01,
    }

    await act(async () => {
      await result.current.startTrading(params)
    })

    expect(result.current.isTrading).toBe(false)
    expect(result.current.error).toBe('Test error')
  })

  it('should stop trading', async () => {
    mockExecuteTradeStrategy.mockResolvedValueOnce({
      success: true,
      txid: 'mock-tx',
      action: 'buy',
      token: 'SOL',
      amount: 1,
      confidence: 0.9,
    })

    const { result } = renderHook(() => useAutoTrader(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.startTrading({
        walletAddress: 'mock-wallet',
        maxAmount: 100,
        slippage: 0.01,
      })
    })

    act(() => {
      result.current.stopTrading()
    })

    expect(result.current.isTrading).toBe(false)
  })

  it('should update trading parameters', async () => {
    mockExecuteTradeStrategy.mockResolvedValueOnce({
      success: true,
      txid: 'mock-tx',
      action: 'buy',
      token: 'SOL',
      amount: 1,
      confidence: 0.9,
    })

    const { result } = renderHook(() => useAutoTrader(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.startTrading({
        walletAddress: 'mock-wallet',
        maxAmount: 100,
        slippage: 0.01,
      })
    })

    act(() => {
      result.current.updateParameters({ maxAmount: 200 })
    })

    expect(result.current.parameters).toEqual({
      walletAddress: 'mock-wallet',
      maxAmount: 200,
      slippage: 0.01,
    })
  })

  it('should execute next trade', async () => {
    mockExecuteTradeStrategy.mockResolvedValue({
      success: true,
      txid: 'mock-tx',
      action: 'buy',
      token: 'SOL',
      amount: 1,
      confidence: 0.9,
    })

    const { result } = renderHook(() => useAutoTrader(), {
      wrapper: createWrapper(),
    })

    const params = {
      walletAddress: 'mock-wallet',
      maxAmount: 100,
      slippage: 0.01,
    }

    await act(async () => {
      await result.current.startTrading(params)
    })

    await act(async () => {
      await result.current.executeNextTrade()
    })

    expect(mockExecuteTradeStrategy).toHaveBeenCalledTimes(2)
    expect(mockExecuteTradeStrategy).toHaveBeenCalledWith(params)
  })
}) 