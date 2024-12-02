import { render, screen, waitFor } from '@testing-library/react'
import WalletAnalysis from '@/components/wallet-analysis'
import { getWalletData } from '@/lib/api-client'
import { act } from '@testing-library/react'

jest.mock('@/lib/api-client')

describe('WalletAnalysis', () => {
  const mockWalletAddress = '11111111111111111111111111111111'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders loading state', () => {
    render(<WalletAnalysis walletAddress={mockWalletAddress} />)
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
  })

  it('renders error state', async () => {
    const mockError = new Error('Failed to fetch')
    ;(getWalletData as jest.Mock).mockRejectedValueOnce(mockError)

    let rendered: ReturnType<typeof render>
    rendered = render(<WalletAnalysis walletAddress={mockWalletAddress} />)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Error')).toBeInTheDocument()
      expect(screen.getByText('Failed to fetch')).toBeInTheDocument()
    }, { timeout: 2000 })

    rendered.unmount()
  })

  it('renders wallet data', async () => {
    const mockData = {
      transactionCount: 100,
      uniqueTokens: 5,
      avgTransactionValue: 1000,
      tradeFrequency: 0.5,
      profitRatio: 0.1,
      riskLevel: 0.3,
      timeInMarket: 90,
    }

    ;(getWalletData as jest.Mock).mockResolvedValueOnce(mockData)

    let rendered: ReturnType<typeof render>
    rendered = render(<WalletAnalysis walletAddress={mockWalletAddress} />)

    await waitFor(() => {
      expect(screen.getByText('Transaction Count')).toBeInTheDocument()
      expect(screen.getByText('100')).toBeInTheDocument()
      expect(screen.getByText('Unique Tokens')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    }, { timeout: 2000 })

    rendered.unmount()
  })
})

