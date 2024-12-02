import { z } from 'zod'

// API Base Configuration
export const API_CONFIG = {
  BASE_URL: 'https://data.solanatracker.io',
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.SOLANATRACKER_API_KEY || '',
  },
  RATE_LIMITS: {
    FREE: '1/second',
    STARTER: 'none',
    ADVANCED: 'none',
    PRO: 'none',
    PREMIUM: 'none',
    BUSINESS: 'none',
    ENTERPRISE: 'none',
    ENTERPRISE_PLUS: 'none',
  },
} as const

// Response Types
export const TokenSchema = z.object({
  name: z.string(),
  symbol: z.string(),
  mint: z.string(),
  uri: z.string().optional(),
  decimals: z.number(),
  image: z.string().optional(),
  description: z.string().optional(),
  extensions: z.object({
    twitter: z.string().optional(),
    telegram: z.string().optional(),
  }).optional(),
  tags: z.array(z.string()).optional(),
  creator: z.object({
    name: z.string().optional(),
    site: z.string().optional(),
  }).optional(),
  hasFileMetaData: z.boolean(),
})

export const PoolSchema = z.object({
  liquidity: z.object({
    quote: z.number(),
    usd: z.number(),
  }),
  price: z.object({
    quote: z.number(),
    usd: z.number(),
  }),
  tokenSupply: z.number(),
  lpBurn: z.number(),
  tokenAddress: z.string(),
  marketCap: z.object({
    quote: z.number(),
    usd: z.number(),
  }),
  market: z.string(),
  quoteToken: z.string(),
  decimals: z.number(),
  security: z.object({
    freezeAuthority: z.string().nullable(),
    mintAuthority: z.string().nullable(),
  }),
  lastUpdated: z.number(),
  createdAt: z.number(),
  poolId: z.string(),
})

export const EventsSchema = z.object({
  '1m': z.object({ priceChangePercentage: z.number() }),
  '5m': z.object({ priceChangePercentage: z.number() }),
  '15m': z.object({ priceChangePercentage: z.number() }),
  '30m': z.object({ priceChangePercentage: z.number() }),
  '1h': z.object({ priceChangePercentage: z.number() }),
  '2h': z.object({ priceChangePercentage: z.number() }),
  '3h': z.object({ priceChangePercentage: z.number() }),
  '4h': z.object({ priceChangePercentage: z.number() }),
  '5h': z.object({ priceChangePercentage: z.number() }),
  '6h': z.object({ priceChangePercentage: z.number() }),
  '12h': z.object({ priceChangePercentage: z.number() }),
  '24h': z.object({ priceChangePercentage: z.number() }),
})

export const RiskSchema = z.object({
  rugged: z.boolean(),
  risks: z.array(z.object({
    name: z.string(),
    description: z.string(),
    level: z.string(),
    score: z.number(),
  })),
  score: z.number(),
})

// API Endpoints Documentation
export const API_ENDPOINTS = {
  // Token Information
  GET_TOKEN: {
    path: '/tokens/:tokenAddress',
    method: 'GET',
    description: 'Retrieve all information for a specific token',
    response: z.object({
      token: TokenSchema,
      pools: z.array(PoolSchema),
      events: EventsSchema,
      risk: RiskSchema,
      buys: z.number(),
      sells: z.number(),
      txns: z.number(),
    }),
  },

  GET_TOKEN_HOLDERS: {
    path: '/tokens/:tokenAddress/holders',
    method: 'GET',
    description: 'Get the top 100 holders for a specific token',
    response: z.object({
      total: z.number(),
      accounts: z.array(z.object({
        wallet: z.string(),
        amount: z.number(),
        value: z.object({
          quote: z.number(),
          usd: z.number(),
        }),
        percentage: z.number(),
      })),
    }),
  },

  GET_TOKEN_ATH: {
    path: '/tokens/:tokenAddress/ath',
    method: 'GET',
    description: 'Retrieve the all time high price of a token',
    response: z.object({
      highest_price: z.number(),
      timestamp: z.number(),
    }),
  },

  // Price Information
  GET_PRICE: {
    path: '/price',
    method: 'GET',
    params: {
      token: z.string(),
      priceChanges: z.boolean().optional(),
    },
    response: z.object({
      price: z.number(),
      liquidity: z.number(),
      marketCap: z.number(),
      lastUpdated: z.number(),
    }),
  },

  GET_PRICE_HISTORY: {
    path: '/price/history',
    method: 'GET',
    params: {
      token: z.string(),
    },
    response: z.object({
      current: z.number(),
      '3d': z.number(),
      '5d': z.number(),
      '7d': z.number(),
      '14d': z.number(),
      '30d': z.number(),
    }),
  },

  // Wallet Information
  GET_WALLET: {
    path: '/wallet/:owner',
    method: 'GET',
    description: 'Get all tokens in a wallet with current value in USD',
    response: z.object({
      tokens: z.array(z.object({
        token: TokenSchema,
        pools: z.array(PoolSchema),
        events: EventsSchema,
        risk: RiskSchema,
        balance: z.number(),
        value: z.number(),
      })),
      total: z.number(),
      totalSol: z.number(),
      timestamp: z.string(),
    }),
  },

  GET_WALLET_TRADES: {
    path: '/wallet/:owner/trades',
    method: 'GET',
    params: {
      cursor: z.string().optional(),
    },
    response: z.object({
      trades: z.array(z.object({
        tx: z.string(),
        from: z.object({
          address: z.string(),
          amount: z.number(),
          token: z.object({
            name: z.string(),
            symbol: z.string(),
            image: z.string(),
            decimals: z.number(),
          }),
        }),
        to: z.object({
          address: z.string(),
          amount: z.number(),
          token: z.object({
            name: z.string(),
            symbol: z.string(),
            image: z.string(),
            decimals: z.number(),
          }),
        }),
        price: z.object({
          usd: z.number(),
          sol: z.string(),
        }),
        volume: z.object({
          usd: z.number(),
          sol: z.number(),
        }),
        wallet: z.string(),
        program: z.string(),
        time: z.number(),
      })),
      nextCursor: z.number(),
      hasNextPage: z.boolean(),
    }),
  },

  // Chart Data
  GET_CHART: {
    path: '/chart/:token/:pool?',
    method: 'GET',
    params: {
      type: z.enum(['1s', '5s', '15s', '1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1mn']).optional(),
      time_from: z.number().optional(),
      time_to: z.number().optional(),
      marketCap: z.boolean().optional(),
    },
    response: z.object({
      oclhv: z.array(z.object({
        open: z.number(),
        close: z.number(),
        low: z.number(),
        high: z.number(),
        volume: z.number(),
        time: z.number(),
      })),
    }),
  },

  // PnL Data
  GET_WALLET_PNL: {
    path: '/pnl/:wallet',
    method: 'GET',
    params: {
      showHistoricPnL: z.boolean().optional(),
      hideDetails: z.boolean().optional(),
    },
    response: z.object({
      tokens: z.record(z.string(), z.object({
        holding: z.number(),
        held: z.number(),
        sold: z.number(),
        realized: z.number(),
        unrealized: z.number(),
        total: z.number(),
        total_sold: z.number(),
        total_invested: z.number(),
        average_buy_amount: z.number(),
        current_value: z.number(),
        cost_basis: z.number(),
      })),
      summary: z.object({
        realized: z.number(),
        unrealized: z.number(),
        total: z.number(),
        totalInvested: z.number(),
        averageBuyAmount: z.number(),
        totalWins: z.number(),
        totalLosses: z.number(),
        winPercentage: z.number(),
        lossPercentage: z.number(),
      }),
    }),
  },
} as const

// Export types
export type Token = z.infer<typeof TokenSchema>
export type Pool = z.infer<typeof PoolSchema>
export type Events = z.infer<typeof EventsSchema>
export type Risk = z.infer<typeof RiskSchema>
export type APIEndpoints = typeof API_ENDPOINTS 