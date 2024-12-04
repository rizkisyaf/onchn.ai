'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { detectDCAPattern, getDCAPDA } from '@/lib/dca-detection'
import { DCAPattern, DCAAnalysis as DCAAnalysisType } from '@/types/dca'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'

interface DCAAnalysisProps {
  walletAddress: string
}

export function DCAAnalysis({ walletAddress }: DCAAnalysisProps) {
  const [patterns, setPatterns] = useState<DCAPattern[]>([])
  const [analysis, setAnalysis] = useState<DCAAnalysisType | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const analyzeDCAPatterns = async () => {
      setLoading(true)
      try {
        const dcaPatterns = await detectDCAPattern(walletAddress)
        setPatterns(dcaPatterns)

        const analysis = await calculateDCAMetrics(dcaPatterns, walletAddress)
        setAnalysis(analysis)
      } catch (error) {
        console.error('Error analyzing DCA patterns:', error)
      } finally {
        setLoading(false)
      }
    }

    if (walletAddress) {
      analyzeDCAPatterns()
    }
  }, [walletAddress])

  if (loading) return <Card className="p-6"><p>Loading analysis...</p></Card>
  if (!analysis) return null

  return (
    <Card className="p-6 bg-white/5 border-white/10">
      <h3 className="text-xl font-semibold mb-4">DCA Analysis</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* DCA Overview */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              title="Frequency"
              value={analysis.frequency}
            />
            <MetricCard
              title="Average Amount"
              value={`${analysis.averageAmount.toFixed(2)} SOL`}
            />
            <MetricCard
              title="Consistency"
              value={`${(analysis.consistency * 100).toFixed(1)}%`}
            />
            <MetricCard
              title="Success Rate"
              value={`${(analysis.successRate * 100).toFixed(1)}%`}
            />
            <MetricCard
              title="Unexecuted Amount"
              value={`${analysis.unexecutedAmount.toFixed(2)} SOL`}
            />
          </div>

          <div className="mt-6">
            <h4 className="font-medium mb-2">Time Preference</h4>
            <p className="text-gray-400">{analysis.timePreference}</p>
          </div>
        </div>

        {/* DCA Performance Chart */}
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={patterns}>
              <XAxis
                dataKey="startDate"
                tickFormatter={(date) => new Date(date).toLocaleDateString()}
              />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="averagePrice"
                stroke="#8884d8"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  )
}

function MetricCard({ title, value }: { title: string, value: string }) {
  return (
    <div className="p-4 rounded-lg bg-white/5">
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-lg font-semibold mt-1">{value}</p>
    </div>
  )
}

async function calculateDCAMetrics(patterns: DCAPattern[], walletAddress: string): Promise<DCAAnalysisType> {
  const pdaData = await getDCAPDA(walletAddress);
  const unexecutedAmount = pdaData.reduce((sum: number, pda) => sum + pda.remainingAmount, 0);

  // Calculate frequency mode
  const frequencies = patterns.map(p => p.frequency)
  const mode = calculateMode(frequencies)
  const frequencyStr = `${mode} minutes`

  // Calculate average amount
  const avgAmount = patterns.reduce((sum, p) => sum + p.amountPerOrder, 0) / patterns.length

  // Calculate consistency (how well they stick to the schedule)
  const consistency = calculateConsistency(patterns)

  // Calculate time preference
  const timePreference = calculateTimePreference(patterns)

  // Calculate success rate
  const successRate = patterns.length > 0 ? patterns.filter(p => p.remainingOrders > 0).length / patterns.length : 0

  return {
    frequency: frequencyStr,
    averageAmount: avgAmount,
    consistency,
    timePreference,
    successRate,
    unexecutedAmount
  }
}

function calculateMode(numbers: number[]): number {
  const frequency: { [key: number]: number } = {}
  let maxFreq = 0
  let mode = numbers[0]

  numbers.forEach(num => {
    frequency[num] = (frequency[num] || 0) + 1
    if (frequency[num] > maxFreq) {
      maxFreq = frequency[num]
      mode = num
    }
  })

  return mode
}

function calculateConsistency(patterns: DCAPattern[]): number {
  if (patterns.length < 2) return 1

  const intervals = []
  for (let i = 1; i < patterns.length; i++) {
    const expected = patterns[i - 1].frequency
    const actual = (patterns[i].startDate.getTime() - patterns[i - 1].startDate.getTime()) / (60 * 1000)
    intervals.push(Math.abs(actual - expected) / expected)
  }

  return 1 - (intervals.reduce((a, b) => a + b, 0) / intervals.length)
}

function calculateTimePreference(patterns: DCAPattern[]): string {
  const hours = patterns.map(p => p.startDate.getUTCHours())
  const mode = calculateMode(hours)
  return `UTC ${mode}:00-${mode + 1}:00`
}

