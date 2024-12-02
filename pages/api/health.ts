import { Connection } from '@solana/web3.js'
import type { NextApiRequest, NextApiResponse } from 'next'

type HealthResponse = {
  status: 'ok' | 'error'
  version: string
  timestamp: string
  services: {
    solana: boolean
    jupiterApi: boolean
    database: boolean
  }
  uptime: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>
) {
  try {
    // Check Solana connection
    const connection = new Connection('https://api.mainnet-beta.solana.com')
    const solanaHealth = await connection.getSlot().then(() => 'ok').catch(() => 'error')
    
    // Check Jupiter API
    const jupiterHealth = await fetch('https://quote-api.jup.ag/v6/health')
    
    // Check database (if applicable)
    // const dbHealth = await prisma.$queryRaw`SELECT 1`

    const health: HealthResponse = {
      status: 'ok',
      version: process.env.NEXT_PUBLIC_VERSION || '1.0.0',
      timestamp: new Date().toISOString(),
      services: {
        solana: solanaHealth === 'ok',
        jupiterApi: jupiterHealth.ok,
        database: true, // Replace with actual DB check
      },
      uptime: process.uptime(),
    }

    res.status(200).json(health)
  } catch (error) {
    const health: HealthResponse = {
      status: 'error',
      version: process.env.NEXT_PUBLIC_VERSION || '1.0.0',
      timestamp: new Date().toISOString(),
      services: {
        solana: false,
        jupiterApi: false,
        database: false,
      },
      uptime: process.uptime(),
    }

    res.status(503).json(health)
  }
} 