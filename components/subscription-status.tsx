'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSubscription } from '@/hooks/useSubscription'
import { Crown as CrownIcon, Clock as ClockIcon } from 'lucide-react'
import { motion } from 'framer-motion'

export function SubscriptionStatus() {
  const { currentPlan } = useSubscription()
  
  // In a real app, these would come from your backend
  const expiryDate = new Date()
  expiryDate.setMonth(expiryDate.getMonth() + 1)
  
  const daysRemaining = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="p-4 bg-white/5 border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CrownIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{currentPlan.name}</h3>
              <p className="text-sm text-gray-400">
                {currentPlan.id === 'free' ? 'Free Trial' : `$${currentPlan.price}/month`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm text-gray-400">
                <ClockIcon className="h-4 w-4" />
                {daysRemaining} days remaining
              </div>
              <p className="text-xs text-gray-500">
                Expires {expiryDate.toLocaleDateString()}
              </p>
            </div>
            
            {currentPlan.id === 'free' && (
              <Button size="sm">
                Upgrade Now
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
} 