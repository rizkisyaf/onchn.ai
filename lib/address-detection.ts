import { PublicKey, Connection } from '@solana/web3.js'
import { Trade, WalletData } from '@/types/trade'

// Import existing behavior analysis functions
import { calculateRiskScore, determineTradingStyle } from '@/hooks/use-behavior-analysis'

// Add API client function
async function getWalletTrades(address: string): Promise<Trade[]> {
  const response = await fetch(`/api/wallet/${address}/trades`)
  if (!response.ok) {
    throw new Error('Failed to fetch wallet trades')
  }
  return response.json()
}

export interface CompiledInstruction {
  programIdIndex: number
  accounts: number[]
  data: string
}

export interface TransactionMessage {
  accountKeys: PublicKey[]
  instructions: CompiledInstruction[]
}

export interface TransactionInfo {
  transaction: {
    message: TransactionMessage
  }
}

export interface AddressMetadata {
  type: 'pda' | 'alt' | 'wallet' | 'program' | 'unknown'
  program?: string
  seeds?: string[]
  bump?: number
  risk?: {
    level: 'low' | 'medium' | 'high'
    reason: string
    score?: number
  }
}

export class AddressDetectionService {
  private connection: Connection

  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl)
  }

  async detectAddressType(address: string): Promise<AddressMetadata> {
    try {
      const pubkey = new PublicKey(address)
      const accountInfo = await this.connection.getAccountInfo(pubkey)

      if (!accountInfo) {
        return {
          type: 'unknown',
          risk: {
            level: 'high',
            reason: 'Account does not exist',
            score: 1.0
          }
        }
      }

      // Check if program
      if (accountInfo.executable) {
        const programPatterns = await this.analyzeTransactionPatterns(address)
        return {
          type: 'program',
          program: address,
          risk: {
            level: programPatterns.programAnalysis.uniquePrograms > 100 ? 'high' : 'medium',
            reason: `Program interacts with ${programPatterns.programAnalysis.uniquePrograms} unique programs`,
            score: programPatterns.programAnalysis.uniquePrograms / 200 // Normalize to [0,1]
          }
        }
      }

      // Check if PDA
      try {
        const [pda, bump] = await PublicKey.findProgramAddress(
          [Buffer.from(address)],
          pubkey
        )
        if (pda) {
          return {
            type: 'pda',
            bump,
            seeds: [address],
            risk: {
              level: 'medium',
              reason: 'PDA with standard derivation',
              score: 0.5
            }
          }
        }
      } catch {} // Not a PDA, continue checking

      // Check if ALT
      const isALT = await this.isAddressLookupTable(address)
      if (isALT) {
        const patterns = await this.analyzeTransactionPatterns(address)
        const frequency = patterns.temporalAnalysis.averageInterval
        return {
          type: 'alt',
          risk: {
            level: frequency < 3600 ? 'high' : 'medium', // High risk if < 1 hour average interval
            reason: `High frequency ALT usage: ${frequency}s average interval`,
            score: Math.min(3600 / frequency, 1) // Normalize to [0,1]
          }
        }
      }

      // Regular wallet analysis
      const trades = await getWalletTrades(address)
      const avgValue = trades.reduce((sum: number, t: Trade) => sum + t.value, 0) / trades.length
      const tokens = [...new Set(trades.map((t: Trade) => t.token))]
      const totalInflow = trades
        .filter((t: Trade) => t.type === 'receive')
        .reduce((sum: number, t: Trade) => sum + t.value, 0)
      const totalOutflow = trades
        .filter((t: Trade) => t.type === 'send')
        .reduce((sum: number, t: Trade) => sum + t.value, 0)
      const patterns = await this.analyzeTransactionPatterns(address)
      
      const riskScore = await calculateRiskScore({
        transactionCount: patterns.temporalAnalysis.totalTransactions,
        uniqueTokens: tokens.length,
        avgTransactionValue: avgValue,
        tradeFrequency: patterns.temporalAnalysis.averageInterval,
        profitRatio: totalInflow / totalOutflow,
        riskLevel: 0,
        timeInMarket: Date.now() - patterns.temporalAnalysis.firstSeen,
        totalInflow,
        totalOutflow,
        lastActivity: patterns.temporalAnalysis.lastSeen,
        tokens: tokens.map(t => ({ 
          address: '', 
          symbol: t,
          name: t,
          decimals: 0,
          balance: 0,
          value: 0,
          price: 0,
          change24h: 0
        })),
        stats: {
          totalValue: totalInflow + totalOutflow,
          totalTransactions: patterns.temporalAnalysis.totalTransactions,
          uniqueTokens: tokens.length,
          avgTransactionValue: avgValue,
          lastActivity: patterns.temporalAnalysis.lastSeen || Date.now()
        }
      })

      return {
        type: 'wallet',
        risk: {
          level: riskScore > 0.7 ? 'high' : riskScore > 0.4 ? 'medium' : 'low',
          reason: `Based on ${patterns.temporalAnalysis.totalTransactions} transactions`,
          score: riskScore
        }
      }

    } catch (error) {
      console.error('Error detecting address type:', error)
      return {
        type: 'unknown',
        risk: {
          level: 'high',
          reason: 'Failed to analyze address',
          score: 1.0
        }
      }
    }
  }

  private async isAddressLookupTable(address: string): Promise<boolean> {
    try {
      const pubkey = new PublicKey(address)
      const accountInfo = await this.connection.getAccountInfo(pubkey)
      return accountInfo?.owner.equals(new PublicKey('AddressLookupTab1e1111111111111111111111111')) || false
    } catch {
      return false
    }
  }

  async analyzeTransactionPatterns(address: string) {
    const pubkey = new PublicKey(address)
    const signatures = await this.connection.getSignaturesForAddress(pubkey)
    const txs = await Promise.all(
      signatures.slice(0, 100).map(sig => 
        this.connection.getTransaction(sig.signature)
      )
    )

    const validTxs = txs.filter(tx => tx !== null)
    const programs = new Set(
      validTxs.flatMap(tx => 
        tx!.transaction.message.instructions.map(ix => 
          tx!.transaction.message.accountKeys[ix.programIdIndex].toBase58()
        )
      )
    )

    const firstTx = signatures[signatures.length - 1]
    const lastTx = signatures[0]
    const now = Date.now() / 1000 // Current time in seconds

    return {
      temporalAnalysis: {
        averageInterval: signatures.length > 1 
          ? ((lastTx.blockTime || now) - (firstTx.blockTime || now)) / signatures.length 
          : 3600,
        totalTransactions: signatures.length,
        firstSeen: (firstTx.blockTime || now) * 1000,
        lastSeen: (lastTx.blockTime || now) * 1000
      },
      programAnalysis: {
        uniquePrograms: programs.size
      }
    }
  }
}


