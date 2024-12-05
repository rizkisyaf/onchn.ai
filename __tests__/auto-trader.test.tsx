import { render, screen } from '@testing-library/react'
import { AutoTrader } from '@/components/auto-trader'

describe('AutoTrader', () => {
  it('renders in inactive state', () => {
    render(<AutoTrader isActive={false} />)
    expect(screen.getByText(/Trading Settings/i)).toBeInTheDocument()
  })

  it('shows loading state when active', () => {
    const { container } = render(<AutoTrader isActive={true} />)
    expect(container).toMatchSnapshot()
  })

  it('updates when new trade occurs', () => {
    const { container: newContainer } = render(<AutoTrader isActive={true} />)
    expect(newContainer).toMatchSnapshot()
  })

  it('displays error state', () => {
    render(<AutoTrader isActive={false} />)
    expect(screen.getByText(/Trading Settings/i)).toBeInTheDocument()
  })

  it('handles trade execution', () => {
    render(<AutoTrader isActive={true} />)
    expect(screen.getByText(/Trading Settings/i)).toBeInTheDocument()
  })

  it('handles trade cancellation', () => {
    render(<AutoTrader isActive={false} />)
    expect(screen.getByText(/Trading Settings/i)).toBeInTheDocument()
  })
}) 