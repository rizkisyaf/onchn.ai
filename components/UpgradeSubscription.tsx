'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { Check, Sparkles, Zap } from 'lucide-react'

const subscriptionPlans = [
  {
    id: 'basic',
    name: 'Basic',
    price: 9.99,
    features: [
      'Basic wallet analysis',
      'Transaction history',
      'Basic risk assessment',
    ],
    icon: Check,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29.99,
    features: [
      'Advanced wallet analysis',
      'Real-time monitoring',
      'DCA pattern detection',
      'Risk alerts',
      'API access',
    ],
    icon: Sparkles,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99.99,
    features: [
      'Custom analysis tools',
      'Dedicated support',
      'White-label options',
      'Advanced API features',
      'Custom integrations',
      'Team management',
    ],
    icon: Zap,
  },
]

export function UpgradeSubscription() {
  const { data: session, update } = useSession()
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  const handleUpgrade = async (planId: string) => {
    setLoading(true)
    setSelectedPlan(planId)
    try {
      // API call would go here
      await update({ subscription: planId })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setSelectedPlan(null)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Upgrade Your Plan
        </h2>
        <p className="text-gray-400 mt-2">
          Choose the perfect plan for your blockchain analysis needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {subscriptionPlans.map((plan, i) => {
          const Icon = plan.icon
          const isCurrentPlan = plan.id === session?.user?.subscription
          const isLoading = loading && selectedPlan === plan.id

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="relative overflow-hidden group">
                {/* Gradient Border Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-10 transition-opacity" />

                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">{plan.name}</h3>
                      <p className="text-gray-400">
                        ${plan.price.toFixed(2)}/month
                      </p>
                    </div>
                    <Icon className="h-6 w-6 text-primary" />
                  </div>

                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm text-gray-400">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isLoading || isCurrentPlan}
                    className="w-full"
                    variant={isCurrentPlan ? 'outline' : 'default'}
                  >
                    {isCurrentPlan ? (
                      'Current Plan'
                    ) : isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Upgrading...</span>
                      </div>
                    ) : (
                      'Upgrade'
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
