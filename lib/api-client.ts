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
  transactionCount: z.number(),
  uniqueTokens: z.number(),
  avgTransactionValue: z.number(),
  tradeFrequency: z.number(),
  profitRatio: z.number(),
  riskLevel: z.number(),
  timeInMarket: z.number(),
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

