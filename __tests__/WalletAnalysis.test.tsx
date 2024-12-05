import { render, screen, waitFor } from '@testing-library/react'
import { WalletAnalysis } from '@/components/wallet-analysis'
import { getWalletData } from '@/lib/api-client'
import { act } from '@testing-library/react'

jest.mock('@/lib/api-client')

describe('WalletAnalysis', () => {
  const mockWalletAddress = '0x123'
  let rendered: ReturnType<typeof render>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders wallet analysis component', () => {
    render(<WalletAnalysis address={mockWalletAddress} />)
    expect(screen.getByText(/Risk Score/i)).toBeInTheDocument()
  })

  it('displays loading state initially', () => {
    rendered = render(<WalletAnalysis address={mockWalletAddress} />)
    expect(rendered.container).toMatchSnapshot()
  })

  it('updates with wallet data', async () => {
    const mockData = {
      riskScore: 75,
      transactions: [
        {
          type: 'send',
          amount: '10.5',
          token: 'SOL',
          time: '2 mins ago',
        },
      ],
    }

    ;(getWalletData as jest.Mock).mockResolvedValue(mockData)

    rendered = render(<WalletAnalysis address={mockWalletAddress} />)

    await waitFor(() => {
      expect(screen.getByText('75%')).toBeInTheDocument()
    })
  })
})

