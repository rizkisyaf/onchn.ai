'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ArrowUpDown, Wallet } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { handleComponentError } from '@/lib/error-handling'

interface AutoTraderProps {
  isActive: boolean
}

type TradeType = 'buy' | 'sell'

interface Trade {
  pair: string
  time: Date
  amount: number
  type: TradeType
}

export function AutoTrader({ isActive }: AutoTraderProps) {
  const [balance, setBalance] = useState<number>(0)
  const [profit, setProfit] = useState<number>(0)
  const [trades, setTrades] = useState<number>(0)
  const [maxTradeSize, setMaxTradeSize] = useState<string>('')
  const [stopLoss, setStopLoss] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [recentTrades, setRecentTrades] = useState<Trade[]>([])
  const { toast } = useToast()

  const validateSettings = () => {
    const errors: string[] = []
    
    if (maxTradeSize && (parseFloat(maxTradeSize) <= 0 || parseFloat(maxTradeSize) > 100)) {
      errors.push('Maximum trade size must be between 0 and 100 SOL')
    }
    
    if (stopLoss && (parseFloat(stopLoss) <= 0 || parseFloat(stopLoss) > 50)) {
      errors.push('Stop loss must be between 0 and 50%')
    }

    return errors
  }

  const handleMaxTradeSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '' || (/^\d*\.?\d*$/.test(value))) {
      setMaxTradeSize(value)
    }
  }

  const handleStopLossChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '' || (/^\d*\.?\d*$/.test(value))) {
      setStopLoss(value)
    }
  }

  useEffect(() => {
    if (isActive) {
      try {
        setIsLoading(true)
        const errors = validateSettings()
        
        if (errors.length > 0) {
          errors.forEach(error => {
            toast({
              title: 'Invalid Settings',
              description: error
            })
          })
          return
        }

        // Simulate trading activity
        const interval = setInterval(() => {
          setBalance(prev => +(prev + Math.random() * 0.1).toFixed(2))
          setProfit(prev => +(prev + Math.random() * 0.05).toFixed(2))
          setTrades(prev => prev + 1)
          
          const tradeType: TradeType = Math.random() > 0.5 ? 'buy' : 'sell'
          // Add new trade to recent trades
          setRecentTrades(prev => [{
            pair: 'SOL/USDC',
            time: new Date(),
            amount: +(Math.random() * 0.1).toFixed(2),
            type: tradeType
          }, ...prev].slice(0, 3))
        }, 5000)

        setIsLoading(false)
        return () => clearInterval(interval)
      } catch (error) {
        handleComponentError(error as Error, 'AutoTrader useEffect')
        toast({
          title: 'Error',
          description: 'Failed to start auto trader. Please try again.'
        })
        setIsLoading(false)
      }
    }
  }, [isActive, toast])

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Balance</h3>
            <p className="text-2xl font-bold">{balance.toFixed(2)} SOL</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Profit/Loss</h3>
            <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {profit >= 0 ? '+' : ''}{profit.toFixed(2)} SOL
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Total Trades</h3>
            <p className="text-2xl font-bold">{trades}</p>
          </div>
        </motion.div>
      </div>

      {/* Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
          <h3 className="text-xl font-semibold mb-4">Trading Settings</h3>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Maximum Trade Size</Label>
                <Input 
                  type="text"
                  placeholder="0.00"
                  className="bg-white/5 border-white/10"
                  value={maxTradeSize}
                  onChange={handleMaxTradeSizeChange}
                  onBlur={() => {
                    if (maxTradeSize && parseFloat(maxTradeSize) > 100) {
                      toast({
                        title: 'Warning',
                        description: 'Maximum trade size seems high. Please verify.'
                      })
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Stop Loss (%)</Label>
                <Input 
                  type="text"
                  placeholder="0.00"
                  className="bg-white/5 border-white/10"
                  value={stopLoss}
                  onChange={handleStopLossChange}
                  onBlur={() => {
                    if (stopLoss && parseFloat(stopLoss) > 50) {
                      toast({
                        title: 'Warning',
                        description: 'Stop loss percentage is quite high. Consider a lower value.'
                      })
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Auto Compound Profits</Label>
                <p className="text-sm text-gray-400">Automatically reinvest profits into new trades</p>
              </div>
              <Switch />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recent Trades */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
          <h3 className="text-xl font-semibold mb-4">Recent Trades</h3>
          <div className="space-y-4">
            {recentTrades.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No trades yet</p>
            ) : (
              recentTrades.map((trade, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-4">
                    <ArrowUpDown className={trade.type === 'buy' ? "text-green-500" : "text-red-500"} />
                    <div>
                      <p className="font-medium">{trade.pair}</p>
                      <p className="text-sm text-gray-400">
                        {new Date(trade.time).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <p className={trade.type === 'buy' ? "text-green-500" : "text-red-500"}>
                    {trade.type === 'buy' ? '+' : '-'}{trade.amount.toFixed(2)} SOL
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
} 