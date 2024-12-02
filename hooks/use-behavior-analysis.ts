import { useCallback, useState } from 'react'
import { BehaviorModel } from '@/lib/ai/behavior-model'
import { getWalletData } from '@/lib/api-client'
import { useToast } from '@/components/ui/use-toast'
import { WalletData, BehaviorAnalysisResult, WalletState } from '@/types/wallet'
import { AddressDetectionService } from '@/lib/address-detection'
import { getMockBehaviorAnalysis } from '@/lib/services/mock-data'

interface BehaviorAnalysisOptions {
  onAnalysis?: (analysis: BehaviorAnalysisResult) => void
}

export function useBehaviorAnalysis(options: BehaviorAnalysisOptions = {}) {
  const [model] = useState(() => new BehaviorModel())
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()

  const analyze = useCallback(async (address: string) => {
    setIsAnalyzing(true)
    setError(null)

    try {
      const walletData = await getWalletData(address)
      const detectionService = new AddressDetectionService(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL!
      )
      
      const metadata = await detectionService.detectAddressType(address)
      const patterns = await detectionService.analyzeTransactionPatterns(address)
      
      const state: WalletState = {
        transactionCount: patterns.temporalAnalysis.totalTransactions,
        uniqueTokens: walletData.tokens?.length || 0,
        avgTransactionValue: walletData.stats?.avgTransactionValue || 0,
        tradeFrequency: patterns.temporalAnalysis.averageInterval,
        profitRatio: (walletData.totalInflow || 0) / (walletData.totalOutflow || 1),
        riskLevel: metadata.risk?.score || 0,
        timeInMarket: Date.now() - (walletData.stats?.lastActivity || Date.now()),
        totalInflow: walletData.totalInflow || 0,
        totalOutflow: walletData.totalOutflow || 0,
        lastActivity: walletData.stats?.lastActivity || Date.now(),
        tokens: walletData.tokens || [],
        stats: {
          totalValue: walletData.stats?.totalValue || 0,
          totalTransactions: patterns.temporalAnalysis.totalTransactions,
          uniqueTokens: walletData.tokens?.length || 0,
          avgTransactionValue: walletData.stats?.avgTransactionValue || 0,
          lastActivity: walletData.stats?.lastActivity || Date.now()
        }
      }

      const nextAction = await model.predict(state)
      
      return {
        riskScore: metadata.risk?.score || 0,
        tradingBehavior: {
          style: determineTradingStyle(state),
          confidence: 0.8,
          patterns: detectTradingPatterns(state)
        },
        metrics: calculateMetrics(state),
        aiPrediction: {
          nextAction: nextAction.type,
          confidence: nextAction.confidence,
          reasoning: `Based on ${nextAction.confidence * 100}% confidence analysis`
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to analyze behavior')
      setError(error)
      toast({
        title: 'Error',
        description: error.message,
      })
      throw error
    } finally {
      setIsAnalyzing(false)
    }
  }, [model, toast])

  return {
    analyze,
    isAnalyzing,
    error,
  }
}

export async function calculateRiskScore(state: WalletState): Promise<number> {
  const factors = [
    state.avgTransactionValue / 1000,
    state.stats.totalTransactions / 1000,
    state.uniqueTokens / 100,
    state.totalInflow / 1000000,
    state.totalOutflow / 1000000,
  ]

  const weights = [0.3, 0.2, 0.2, 0.15, 0.15]
  const weightedSum = factors.reduce((sum, factor, i) => sum + factor * weights[i], 0)

  return Math.min(Math.max(weightedSum, 0), 1)
}

export function determineTradingStyle(state: WalletState): 'day_trader' | 'swing_trader' | 'hodler' | 'unknown' {
  const avgTimeBetweenTrades = state.stats.totalTransactions > 1
    ? (Date.now() - state.stats.lastActivity) / state.stats.totalTransactions
    : Infinity

  if (avgTimeBetweenTrades < 24 * 60 * 60 * 1000) { // Less than 1 day
    return 'day_trader'
  } else if (avgTimeBetweenTrades < 7 * 24 * 60 * 60 * 1000) { // Less than 1 week
    return 'swing_trader'
  } else if (avgTimeBetweenTrades < 30 * 24 * 60 * 60 * 1000) { // Less than 1 month
    return 'hodler'
  } else {
    return 'unknown'
  }
}

function detectTradingPatterns(state: WalletState) {
  return process.env.NODE_ENV === 'development' 
    ? getMockBehaviorAnalysis().tradingBehavior.patterns
    : [
      {
        type: 'Volume Analysis',
        score: Math.min(state.transactionCount / 100 * 100, 100),
        description: `${state.transactionCount} transactions analyzed`
      },
      {
        type: 'Risk Profile',
        score: (1 - state.riskLevel) * 100,
        description: `Based on trading patterns and exposure`
      }
    ]
}

function calculateMetrics(state: WalletState) {
  return process.env.NODE_ENV === 'development'
    ? getMockBehaviorAnalysis().metrics
    : {
      tradeFrequency: state.transactionCount / (state.timeInMarket / (24 * 60 * 60 * 1000)),
      avgHoldingPeriod: state.timeInMarket / state.transactionCount / (24 * 60 * 60 * 1000),
      winRate: state.profitRatio > 1 ? 0.7 : 0.3,
      profitFactor: state.profitRatio,
      sharpeRatio: (state.profitRatio - 1) / state.riskLevel
    }
} 