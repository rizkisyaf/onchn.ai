'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AutoTrader } from '@/components/auto-trader'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Bot as RobotIcon, Power, Loader2 } from 'lucide-react'
import { ErrorBoundary } from '@/components/error-boundary'
import { useSubscription } from '@/hooks/useSubscription'

export default function AutoTraderPage() {
  const { canAccessFeature, currentPlan } = useSubscription()
  const canAccessAutoTrader = canAccessFeature('automatedTrading')
  const [isActive, setIsActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  if (!canAccessAutoTrader) {
    return (
      <div className="p-6">
        <Card className="p-6 bg-white/5 border-white/10">
          <h2 className="text-xl font-semibold mb-4">Feature Restricted</h2>
          <p className="text-gray-400 mb-4">
            Auto trading is only available for Pro tier users. Upgrade your subscription to access automated trading features.
          </p>
          <Button>Upgrade Now</Button>
        </Card>
      </div>
    )
  }

  const handleToggle = async () => {
    try {
      setIsLoading(true)
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setIsActive(!isActive)
      toast({
        title: isActive ? 'Auto Trader Deactivated' : 'Auto Trader Activated',
        description: isActive ? 'Trading bot has been stopped' : 'Trading bot is now running',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to toggle auto trader. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <RobotIcon className="h-8 w-8 text-primary" />
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold"
        >
          Auto Trader
        </motion.h1>
      </div>

      {/* Control Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6 bg-white/5 border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">Trading Bot</h2>
              <p className="text-gray-400">
                {isActive 
                  ? 'Bot is actively monitoring and trading based on behavior analysis'
                  : 'Start the bot to begin automated trading'}
              </p>
            </div>
            <Button 
              onClick={handleToggle}
              size="lg"
              disabled={isLoading}
              className={`${
                isActive 
                  ? 'bg-accent hover:bg-accent/90' 
                  : 'bg-primary hover:bg-primary/90'
              } text-white rounded-full px-8`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {isActive ? 'Stopping...' : 'Starting...'}
                </>
              ) : (
                <>
                  <Power className="mr-2 h-5 w-5" />
                  {isActive ? 'Stop' : 'Start'}
                </>
              )}
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Trading Interface */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <AutoTrader isActive={isActive} />
      </motion.div>
    </div>
  )
} 