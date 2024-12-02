import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { AutoTrader } from '@/components/auto-trader'
import { useAutoTrader } from '@/hooks/use-auto-trader'

jest.mock('@/hooks/use-auto-trader')

describe('AutoTrader', () => {
  const mockStartTrading = jest.fn()
  const mockStopTrading = jest.fn()
  const mockUpdateParameters = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    cleanup()
    ;(useAutoTrader as jest.Mock).mockReturnValue({
      isTrading: false,
      error: null,
      lastTrade: null,
      parameters: {
        walletAddress: 'test-wallet',
        maxAmount: 1,
        slippage: 0.01,
      },
      startTrading: mockStartTrading,
      stopTrading: mockStopTrading,
      updateParameters: mockUpdateParameters,
    })
  })

  it('renders basic UI elements', () => {
    render(<AutoTrader />)
    expect(screen.getByText('Auto Trader')).toBeInTheDocument()
    expect(screen.getByText('Trading Enabled')).toBeInTheDocument()
    expect(screen.getByLabelText('Max Amount')).toBeInTheDocument()
    expect(screen.getByLabelText('Slippage (%)')).toBeInTheDocument()
  })

  it('handles trading toggle', () => {
    const { container } = render(<AutoTrader />)
    const toggle = container.querySelector('button[role="switch"]') as HTMLElement
    fireEvent.click(toggle)
    expect(mockStartTrading).toHaveBeenCalledWith({
      walletAddress: 'test-wallet',
      maxAmount: 1,
      slippage: 0.01,
    })

    // Mock trading state
    ;(useAutoTrader as jest.Mock).mockReturnValue({
      isTrading: true,
      error: null,
      lastTrade: null,
      parameters: {
        walletAddress: 'test-wallet',
        maxAmount: 1,
        slippage: 0.01,
      },
      startTrading: mockStartTrading,
      stopTrading: mockStopTrading,
      updateParameters: mockUpdateParameters,
    })

    const { container: newContainer } = render(<AutoTrader />)
    const activeToggle = newContainer.querySelector('button[role="switch"]') as HTMLElement
    fireEvent.click(activeToggle)
    expect(mockStopTrading).toHaveBeenCalled()
  })

  it('displays error message', () => {
    ;(useAutoTrader as jest.Mock).mockReturnValue({
      isTrading: false,
      error: 'Test error',
      lastTrade: null,
      parameters: {
        walletAddress: 'test-wallet',
        maxAmount: 1,
        slippage: 0.01,
      },
      startTrading: mockStartTrading,
      stopTrading: mockStopTrading,
      updateParameters: mockUpdateParameters,
    })

    render(<AutoTrader />)
    expect(screen.getByText('Test error')).toBeInTheDocument()
  })

  it('displays last trade information', () => {
    ;(useAutoTrader as jest.Mock).mockReturnValue({
      isTrading: true,
      error: null,
      lastTrade: {
        success: true,
        txid: 'mock_txid',
        action: 'buy',
        token: 'SOL',
        amount: 1,
        confidence: 0.8,
      },
      parameters: {
        walletAddress: 'test-wallet',
        maxAmount: 1,
        slippage: 0.01,
      },
      startTrading: mockStartTrading,
      stopTrading: mockStopTrading,
      updateParameters: mockUpdateParameters,
    })

    render(<AutoTrader />)
    expect(screen.getByText('Last Trade')).toBeInTheDocument()
    expect(screen.getByText('Success')).toBeInTheDocument()
    expect(screen.getByText('buy')).toBeInTheDocument()
    expect(screen.getByText('SOL')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('handles parameter updates', () => {
    render(<AutoTrader />)
    
    const maxAmountInput = screen.getByLabelText('Max Amount')
    fireEvent.change(maxAmountInput, { target: { value: '2' } })
    expect(mockUpdateParameters).toHaveBeenCalledWith({
      walletAddress: 'test-wallet',
      maxAmount: 2,
      slippage: 0.01,
    })

    const slippageInput = screen.getByLabelText('Slippage (%)')
    fireEvent.change(slippageInput, { target: { value: '2' } })
    expect(mockUpdateParameters).toHaveBeenCalledWith({
      walletAddress: 'test-wallet',
      maxAmount: 1,
      slippage: 0.02,
    })
  })
}) 