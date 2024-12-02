export const subscriptionPlans = [
  {
    id: 'free',
    name: 'Free Trial',
    description: 'Basic analysis and visualizations',
    price: 0,
    features: [
      'Basic wallet analysis',
      'Standard visualizations',
      'Limited API calls',
      '$5,000 capital limit'
    ],
    capitalLimit: 5000,
    stripePriceId: null
  },
  {
    id: 'basic',
    name: 'Basic Tier',
    description: 'Full forensics and automated trading',
    price: 200,
    features: [
      'Full forensics analysis',
      'Automated trading',
      'Standard dashboards',
      '$20,000 capital limit'
    ],
    capitalLimit: 20000,
    stripePriceId: process.env.STRIPE_BASIC_MONTHLY_PLAN_ID
  },
  {
    id: 'pro',
    name: 'Pro Tier',
    description: 'Advanced analytics and priority features',
    price: 1000,
    features: [
      'Advanced analytics',
      'Priority trade execution',
      'Enhanced notifications',
      '$100,000 capital limit'
    ],
    capitalLimit: 100000,
    stripePriceId: process.env.STRIPE_PRO_MONTHLY_PLAN_ID
  }
]

