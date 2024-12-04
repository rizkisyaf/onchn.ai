import { z } from 'zod'

export interface APIError extends Error {
  code: 'RATE_LIMIT' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'INTERNAL_ERROR'
  message: string
  details?: any
}

export class APIErrorImpl extends Error implements APIError {
  constructor(
    public code: APIError['code'],
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export const WalletDataSchema = z.object({
  address: z.string(),
  wallet: z.string(),
  value: z.number(),
  balance: z.number(),
  tokens: z.array(z.object({
    address: z.string(),
    symbol: z.string(),
    name: z.string(),
    decimals: z.number(),
    balance: z.number(),
    value: z.number(),
    price: z.number(),
    change24h: z.number()
  })),
  transactions: z.array(z.object({
    hash: z.string(),
    timestamp: z.number(),
    type: z.enum(['swap', 'transfer', 'stake', 'unstake', 'other']),
    amount: z.number(),
    value: z.number(),
    source: z.string(),
    target: z.string(),
    from: z.string(),
    to: z.string(),
    fee: z.number(),
    success: z.boolean(),
    programId: z.string().optional(),
    data: z.any().optional()
  })),
  stats: z.object({
    totalValue: z.number(),
    totalTransactions: z.number(),
    uniqueTokens: z.number(),
    avgTransactionValue: z.number(),
    lastActivity: z.number()
  }),
  avgTransactionValue: z.number(),
  totalInflow: z.number(),
  totalOutflow: z.number(),
  uniqueInteractions: z.number(),
  dcaFrequency: z.number(),
  avgDcaAmount: z.number(),
  winRate: z.number(),
  pnl: z.number()
})

export type WalletData = z.infer<typeof WalletDataSchema>

export async function getWalletData(walletAddress: string): Promise<WalletData> {
  try {
    const response = await fetch(`${process.env.SOLANATRACKER_API_URL}/wallet/${walletAddress}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.SOLANATRACKER_API_KEY || '',
      },
    })

    if (!response.ok) {
      throw new APIErrorImpl('INTERNAL_ERROR', `Failed to fetch wallet data: ${response.statusText}`)
    }

    const data = await response.json()
    return WalletDataSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new APIErrorImpl('INTERNAL_ERROR', 'Invalid wallet data format')
    }
    throw error
  }
}

export async function getWalletInfo(walletAddress: string): Promise<WalletData> {
  return getWalletData(walletAddress)
}

export async function getWalletTransactions(walletAddress: string): Promise<any[]> {
  try {
    const response = await fetch(`${process.env.SOLANATRACKER_API_URL}/wallet/${walletAddress}/transactions`, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.SOLANATRACKER_API_KEY || '',
      },
    })

    if (!response.ok) {
      throw new APIErrorImpl('INTERNAL_ERROR', `Failed to fetch wallet transactions: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    throw error
  }
}

