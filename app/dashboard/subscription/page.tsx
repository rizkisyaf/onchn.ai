'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { CreditCard as BillingIcon, Check as CheckIcon, Zap as FeatureIcon } from 'lucide-react'
import { ErrorBoundary } from '@/components/error-boundary'

const plans = [
  {
    name: 'Basic',
    price: '$29',
    period: 'month',
    features: [
      'Basic wallet analysis',
      'Standard alerts',
      'Email support',
      '1 trading bot',
    ],
    isPopular: false
  },
  {
    name: 'Pro',
    price: '$99',
    period: 'month',
    features: [
      'Advanced wallet analysis',
      'Priority alerts',
      'Priority support',
      'Up to 5 trading bots',
      'Custom risk analysis',
      'API access'
    ],
    isPopular: true
  },
  {
    name: 'Enterprise',
    price: '$299',
    period: 'month',
    features: [
      'Full wallet analysis',
      'Real-time alerts',
      '24/7 support',
      'Unlimited trading bots',
      'Custom integrations',
      'Dedicated account manager'
    ],
    isPopular: false
  }
]

export default function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const { toast } = useToast()

  const handleSubscribe = (planName: string) => {
    setSelectedPlan(planName)
    toast({
      title: 'Plan Selected',
      description: `You have selected the ${planName} plan. Redirecting to payment...`,
    })
  }

  return (
    <ErrorBoundary>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <BillingIcon className="h-8 w-8 text-primary" />
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold"
          >
            Subscription Plans
          </motion.h1>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`p-6 bg-white/5 border-white/10 relative ${
                plan.isPopular ? 'ring-2 ring-primary' : ''
              }`}>
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold">{plan.name}</h3>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-gray-400">/{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckIcon className="h-4 w-4 text-green-500" />
                        <span className="text-gray-200">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    onClick={() => handleSubscribe(plan.name)}
                    disabled={selectedPlan === plan.name}
                    className={`w-full ${
                      plan.isPopular 
                        ? 'bg-primary hover:bg-primary/90' 
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    {selectedPlan === plan.name ? (
                      'Processing...'
                    ) : (
                      'Subscribe Now'
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 bg-white/5 border-white/10">
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">All Plans Include</h2>
                <p className="text-gray-400">Core features available in all subscription tiers</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  'Real-time wallet tracking',
                  'Basic behavior analysis',
                  'Email notifications',
                  'Mobile app access',
                  'Community support',
                  'Regular updates'
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <FeatureIcon className="h-5 w-5 text-primary" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </ErrorBoundary>
  )
} 