'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { WalletAnalysis } from '@/components/wallet-analysis'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Search as SearchIcon, Loader2, Wallet as WalletIcon } from 'lucide-react'
import { ErrorBoundary } from '@/components/error-boundary'
import { useSubscription } from '@/hooks/useSubscription'

export default function WalletAnalysisPage() {
  const { canAccessFeature, currentPlan } = useSubscription()
  const canAccessWalletAnalysis = canAccessFeature('advancedAnalytics')
  const [address, setAddress] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const { toast } = useToast()

  if (!canAccessWalletAnalysis) {
    return (
      <div className="p-6">
        <Card className="p-6 bg-white/5 border-white/10">
          <h2 className="text-xl font-semibold mb-4">Feature Restricted</h2>
          <p className="text-gray-400 mb-4">
            Advanced wallet analysis is only available for paid plans. Upgrade your subscription to access this feature.
          </p>
          <Button>Upgrade Now</Button>
        </Card>
      </div>
    )
  }

  const handleAnalyze = () => {
    if (!address) {
      toast({
        title: 'Error',
        description: 'Please enter a wallet address'
      })
      return
    }

    setIsAnalyzing(true)
    // Add error handling for analysis
    try {
      // Analysis logic here
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to analyze wallet. Please try again.'
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <WalletIcon className="h-8 w-8 text-primary" />
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold"
        >
          Wallet Analysis
        </motion.h1>
      </div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6 bg-white/5 border-white/10">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              type="text"
              placeholder="Enter wallet address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="flex-1 bg-white/5 border-white/10"
            />
            <Button 
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="bg-primary hover:bg-primary/90"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <SearchIcon className="mr-2 h-4 w-4" />
                  Analyze
                </>
              )}
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Analysis Results */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <WalletAnalysis address={address} />
      </motion.div>
    </div>
  )
} 