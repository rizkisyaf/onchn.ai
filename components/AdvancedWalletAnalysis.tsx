import React from 'react'
import { Card } from '@/components/ui'
import { WalletData } from '@/types/wallet'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface AdvancedWalletAnalysisProps {
  walletData: WalletData
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export const AdvancedWalletAnalysis: React.FC<AdvancedWalletAnalysisProps> = ({ walletData }) => {
  const tokenDistribution = walletData.tokens.map(token => ({
    name: token.symbol,
    value: token.value
  }))

  const totalValue = walletData.tokens.reduce((sum, token) => sum + token.value, 0)

  const calculateDiversificationScore = () => {
    const herfindahlIndex = walletData.tokens.reduce((sum, token) => {
      const marketShare = token.value / totalValue
      return sum + marketShare * marketShare
    }, 0)
    return (1 - herfindahlIndex) * 100
  }

  const diversificationScore = calculateDiversificationScore()

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Advanced Wallet Analysis</h2>
      
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Portfolio Composition</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={tokenDistribution}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              label
            >
              {tokenDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Diversification Score</h3>
        <p className="text-3xl font-bold">{diversificationScore.toFixed(2)}%</p>
        <p className="text-gray-600">
          {diversificationScore > 70 ? 'Well diversified' : 'Consider diversifying your portfolio'}
        </p>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-2">Token Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={walletData.tokens}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="symbol" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

