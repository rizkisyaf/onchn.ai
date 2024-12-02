export interface Trade {
  type: 'send' | 'receive' | 'swap'
  value: number
  token: string
  timestamp: number
}

export interface WalletData {
  avgTransactionValue: number
  stats: {
    totalTransactions: number
    lastActivity: number
  }
  tokens: string[]
  totalInflow: number
  totalOutflow: number
} 