'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowUpDown, Activity, Shield, Network } from 'lucide-react'

interface WalletAnalysisProps {
  address: string
}

export function WalletAnalysis({ address }: WalletAnalysisProps) {
  const [riskScore, setRiskScore] = useState(75)
  const [transactions, setTransactions] = useState([
    { type: 'send', amount: '10.5', token: 'SOL', time: '2 mins ago' },
    { type: 'receive', amount: '25.0', token: 'USDC', time: '5 mins ago' },
    { type: 'swap', amount: '5.2', token: 'SOL', time: '10 mins ago' },
  ])

  return (
    <div className="space-y-6">
      {/* Risk Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold">Risk Score</h3>
              <p className="text-gray-400">Overall wallet safety assessment</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {riskScore}%
              </p>
              <p className="text-sm text-gray-400">Safe</p>
            </div>
          </div>
          <Progress value={riskScore} className="h-2" />
        </div>
      </motion.div>

      {/* Analysis Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList className="bg-white/5 border-b border-white/10">
            <TabsTrigger value="transactions" className="data-[state=active]:text-primary">
              Transactions
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:text-primary">
              Activity
            </TabsTrigger>
            <TabsTrigger value="connections" className="data-[state=active]:text-primary">
              Connections
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4">
            {transactions.map((tx, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-4 backdrop-blur-sm border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <ArrowUpDown className="text-primary" />
                  <div>
                    <p className="font-medium">{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</p>
                    <p className="text-sm text-gray-400">{tx.time}</p>
                  </div>
                </div>
                <p className="font-medium">
                  {tx.type === 'receive' ? '+' : '-'}{tx.amount} {tx.token}
                </p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
                <Activity className="h-8 w-8 text-primary mb-2" />
                <h4 className="font-medium mb-1">Transaction Volume</h4>
                <p className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">$25,420</p>
                <p className="text-sm text-gray-400">Last 30 days</p>
              </div>
              <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
                <Shield className="h-8 w-8 text-primary mb-2" />
                <h4 className="font-medium mb-1">Security Score</h4>
                <p className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">92/100</p>
                <p className="text-sm text-gray-400">Very Good</p>
              </div>
              <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
                <Network className="h-8 w-8 text-primary mb-2" />
                <h4 className="font-medium mb-1">Network Usage</h4>
                <p className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">156</p>
                <p className="text-sm text-gray-400">Connected dApps</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="connections" className="space-y-4">
            <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
              <h4 className="font-medium mb-4">Connected Wallets</h4>
              <div className="space-y-4">
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div>
                      <p className="font-medium">Wallet {i + 1}</p>
                      <p className="text-sm text-gray-400">7X...4z</p>
                    </div>
                    <p className="text-sm text-gray-400">15 transactions</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}

