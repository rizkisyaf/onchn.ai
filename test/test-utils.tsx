import { WalletProvider } from '@solana/wallet-adapter-react'
import { ReactNode } from 'react'

export const createWrapper = () => {
  return ({ children }: { children: ReactNode }) => (
    <WalletProvider wallets={[]} autoConnect>
      {children}
    </WalletProvider>
  )
} 