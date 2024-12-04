import { useSession } from 'next-auth/react';

export type FeatureType = 
  | 'basicAnalytics' 
  | 'advancedAnalytics' 
  | 'automatedTrading' 
  | 'apiAccess'
  | 'priorityAlerts'

const PLAN_FEATURES = {
  free: ['basicAnalytics'],
  pro: ['basicAnalytics', 'advancedAnalytics', 'automatedTrading', 'priorityAlerts'],
  enterprise: ['basicAnalytics', 'advancedAnalytics', 'automatedTrading', 'apiAccess', 'priorityAlerts'],
} as const

const PLAN_PRICES = {
  free: 0,
  pro: 49,
  enterprise: 199,
} as const

export type SubscriptionTier = keyof typeof PLAN_FEATURES

// For development: set this to 'free', 'pro', or 'enterprise' to test different tiers
const DEV_SUBSCRIPTION_TIER: SubscriptionTier = 'enterprise'

export function useSubscription() {
  const { data: session } = useSession();
  
  // In development, use the DEV_SUBSCRIPTION_TIER
  const tier = process.env.NODE_ENV === 'development' 
    ? DEV_SUBSCRIPTION_TIER 
    : (session?.user?.subscription || 'free') as SubscriptionTier;

  const currentPlan = {
    id: tier,
    name: tier.charAt(0).toUpperCase() + tier.slice(1),
    price: PLAN_PRICES[tier],
  };

  const canAccessFeature = (feature: FeatureType) => {
    const planFeatures = PLAN_FEATURES[tier];
    return planFeatures.includes(feature as any);
  };

  return {
    currentPlan,
    canAccessFeature,
    tier,
  };
}

