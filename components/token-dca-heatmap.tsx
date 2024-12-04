'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { detectDCAPattern } from '@/lib/dca-detection'
import { DCAPattern } from '@/types/dca'
import { ResponsiveContainer, Scatter, ScatterChart, XAxis, YAxis, ZAxis, Tooltip } from 'recharts'

interface TokenDCAHeatmapProps {
  tokenAddress: string
}

interface HeatmapData {
  hour: number
  day: number
  intensity: number
}

export function TokenDCAHeatmap({ tokenAddress }: TokenDCAHeatmapProps) {
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchDCAPatterns = async () => {
      setLoading(true)
      try {
        const patterns = await detectDCAPattern(tokenAddress)
        const data: HeatmapData[] = []
        
        // Convert DCA patterns to heatmap data
        patterns.forEach((pattern: DCAPattern) => {
          const date = new Date(pattern.startDate)
          const hour = date.getHours()
          const day = date.getDay()
          
          // Find existing data point or create new one
          const existingPoint = data.find(d => d.hour === hour && d.day === day)
          if (existingPoint) {
            existingPoint.intensity += pattern.amountPerOrder
          } else {
            data.push({
              hour,
              day,
              intensity: pattern.amountPerOrder
            })
          }
        })

        setHeatmapData(data)
      } catch (error) {
        console.error('Error fetching DCA patterns:', error)
      } finally {
        setLoading(false)
      }
    }

    if (tokenAddress) {
      fetchDCAPatterns()
    }
  }, [tokenAddress])

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const maxIntensity = Math.max(...heatmapData.map(d => d.intensity))

  return (
    <Card className="p-6 bg-white/5 border-white/10">
      <h3 className="text-xl font-semibold mb-4">DCA Heatmap</h3>
      {loading ? (
        <p>Loading heatmap data...</p>
      ) : (
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{
                top: 20,
                right: 20,
                bottom: 20,
                left: 40,
              }}
            >
              <XAxis
                type="number"
                dataKey="hour"
                name="Hour"
                domain={[0, 23]}
                tickFormatter={(hour) => `${hour}:00`}
              />
              <YAxis
                type="number"
                dataKey="day"
                name="Day"
                domain={[0, 6]}
                tickFormatter={(day) => days[day]}
              />
              <ZAxis
                type="number"
                dataKey="intensity"
                range={[50, 500]}
                name="Volume"
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(value: any, name: string) => {
                  if (name === 'Hour') return `${value}:00`
                  if (name === 'Day') return days[value]
                  return `${value.toFixed(2)} SOL`
                }}
              />
              <Scatter
                data={heatmapData}
                fill="#8884d8"
                fillOpacity={0.6}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="mt-4 flex justify-between text-sm text-gray-400">
        <span>Less Activity</span>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#8884d8] opacity-20" />
          <div className="w-4 h-4 rounded-full bg-[#8884d8] opacity-40" />
          <div className="w-4 h-4 rounded-full bg-[#8884d8] opacity-60" />
          <div className="w-4 h-4 rounded-full bg-[#8884d8] opacity-80" />
          <div className="w-4 h-4 rounded-full bg-[#8884d8]" />
        </div>
        <span>More Activity</span>
      </div>
    </Card>
  )
} 