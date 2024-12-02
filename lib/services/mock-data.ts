import { BehaviorAnalysisResult } from "@/types/wallet";

export const getMockBehaviorAnalysis = (): BehaviorAnalysisResult => ({
  riskScore: 0.65,
  tradingBehavior: {
    style: 'swing_trader',
    confidence: 0.85,
    patterns: [
      {
        type: 'DCA Strategy',
        score: 85,
        description: 'Regular buying patterns detected'
      },
      {
        type: 'Smart Money Following',
        score: 92,
        description: 'Correlated with profitable wallets'
      }
    ]
  },
  metrics: {
    tradeFrequency: 3.2,
    avgHoldingPeriod: 48,
    winRate: 0.68,
    profitFactor: 1.8,
    sharpeRatio: 2.1
  },
  aiPrediction: {
    nextAction: 'buy',
    confidence: 0.82,
    reasoning: 'Strong accumulation pattern detected'
  }
}) 