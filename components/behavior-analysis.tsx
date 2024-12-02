'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Progress } from '@/components/ui/progress'
import { Brain, TrendingUp, AlertTriangle, Clock } from 'lucide-react'
import { useBehaviorAnalysis } from '@/hooks/use-behavior-analysis'
import { BehaviorAnalysisResult } from '@/types/wallet'

interface BehaviorAnalysisProps {
  address: string
}

export function BehaviorAnalysis({ address }: BehaviorAnalysisProps) {
  const { analyze, isAnalyzing } = useBehaviorAnalysis()
  const [analysis, setAnalysis] = useState<BehaviorAnalysisResult>()

  useEffect(() => {
    if (address) {
      analyze(address).then(setAnalysis)
    }
  }, [address, analyze])

  return (
    <div className="space-y-6">
      {/* Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
          <div className="flex items-center gap-4 mb-6">
            <Brain className="h-8 w-8 text-primary" />
            <div>
              <h3 className="text-xl font-semibold">Behavior Analysis</h3>
              <p className="text-gray-400">AI-powered wallet behavior assessment</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">Trading Confidence</p>
                <p className="text-sm font-medium">85%</p>
              </div>
              <Progress value={85} className="h-2 bg-white/10" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">Risk Assessment</p>
                <p className="text-sm font-medium">65%</p>
              </div>
              <Progress value={65} className="h-2 bg-white/10" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">Network Score</p>
                <p className="text-sm font-medium">92%</p>
              </div>
              <Progress value={92} className="h-2 bg-white/10" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
            <TrendingUp className="h-8 w-8 text-primary mb-4" />
            <h4 className="font-medium mb-2">Trading Behavior</h4>
            <p className="text-sm text-gray-400">
              Regular trading patterns with consistent volume. Shows disciplined approach to market participation.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
            <AlertTriangle className="h-8 w-8 text-primary mb-4" />
            <h4 className="font-medium mb-2">Risk Analysis</h4>
            <p className="text-sm text-gray-400">
              Moderate risk profile with balanced portfolio distribution. Some exposure to volatile assets.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
            <Clock className="h-8 w-8 text-primary mb-4" />
            <h4 className="font-medium mb-2">Time Analysis</h4>
            <p className="text-sm text-gray-400">
              Active during peak market hours. Shows strategic timing in transactions.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Patterns */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
          <h3 className="text-xl font-semibold mb-4">Detected Patterns</h3>
          <div className="space-y-4">
            {analysis?.tradingBehavior.patterns.map((pattern, i: number) => (
              <div key={i} className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{pattern.type}</h4>
                  <p className="text-sm font-medium">{pattern.score}%</p>
                </div>
                <Progress value={pattern.score} className="h-2 bg-white/10 mb-2" />
                <p className="text-sm text-gray-400">{pattern.description}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
} 