'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { SubscriptionStatus } from '@/components/subscription-status'

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <SubscriptionStatus />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <p className="text-gray-400 mt-2">Welcome to your onchn.ai dashboard</p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 bg-white/5 border-white/10">
            <h3 className="text-sm font-medium text-gray-400">Total Wallets Analyzed</h3>
            <p className="text-2xl font-bold mt-2">1,234</p>
            <p className="text-sm text-green-500 mt-2">+12% from last week</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 bg-white/5 border-white/10">
            <h3 className="text-sm font-medium text-gray-400">Active Trading Bots</h3>
            <p className="text-2xl font-bold mt-2">5</p>
            <p className="text-sm text-green-500 mt-2">3 profitable</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 bg-white/5 border-white/10">
            <h3 className="text-sm font-medium text-gray-400">Total Profit</h3>
            <p className="text-2xl font-bold mt-2">+123.45 SOL</p>
            <p className="text-sm text-green-500 mt-2">+5.2% today</p>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6 bg-white/5 border-white/10">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                <div>
                  <p className="font-medium">New wallet analysis completed</p>
                  <p className="text-sm text-gray-400">2 mins ago</p>
                </div>
                <span className="text-primary">View</span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  )
} 