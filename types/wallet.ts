export interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  balance: number
  value: number
  price: number
  change24h: number
}

export interface Transaction {
  hash: string
  timestamp: number
  type: 'swap' | 'transfer' | 'stake' | 'unstake' | 'other'
  amount: number
  value: number
  source: string
  target: string
  token: Token
  from: string
  to: string
  fee: number
  success: boolean
  programId?: string
  data?: any
}

export interface Interaction {
  address: string
  type: 'transfer' | 'swap' | 'stake' | 'other'
  count: number
  volume: number
  lastInteraction: number
}

export interface WalletData {
  address: string
  wallet: string
  value: number
  balance: number
  tokens: Token[]
  transactions: Transaction[]
  interactions: Interaction[]
  stats: {
    totalValue: number
    totalTransactions: number
    uniqueTokens: number
    avgTransactionValue: number
    lastActivity: number
  }
  avgTransactionValue: number
  totalInflow: number
  totalOutflow: number
  uniqueInteractions: number
  dcaFrequency: number
  avgDcaAmount: number
  winRate: number
  pnl: number
}

export type AddressType = 'pda' | 'alt' | 'wallet' | 'program' | 'unknown'

export interface AddressMetadata {
  type: AddressType
  program?: string
  risk?: {
    score?: number
    level: 'high' | 'medium' | 'low'
    reason: string
  }
}

export interface DCAPattern {
  token: string
  interval: number
  amount: number
  startDate: number | Date
  endDate?: number | Date
  consistency?: number
  confidence?: number
}

export interface WalletState {
  transactionCount: number
  uniqueTokens: number
  avgTransactionValue: number
  tradeFrequency: number
  profitRatio: number
  riskLevel: number
  timeInMarket: number
  totalInflow: number
  totalOutflow: number
  lastActivity: number
  tokens: Token[]
  stats: {
    totalValue: number
    totalTransactions: number
    uniqueTokens: number
    avgTransactionValue: number
    lastActivity: number
  }
}

export interface BehaviorAnalysisResult {
  riskScore: number
  tradingBehavior: {
    style: 'day_trader' | 'swing_trader' | 'hodler' | 'unknown'
    confidence: number
    patterns: {
      type: string
      score: number
      description: string
    }[]
  }
  metrics: {
    tradeFrequency: number
    avgHoldingPeriod: number
    winRate: number
    profitFactor: number
    sharpeRatio: number
  }
  aiPrediction: {
    nextAction: 'buy' | 'sell' | 'hold'
    confidence: number
    reasoning: string
  }
}

export interface APIError extends Error {
  code: 'RATE_LIMIT' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'INTERNAL_ERROR'
  message: string
  details?: any
} 