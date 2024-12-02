'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Search as SearchIcon, Loader2, Coins as TokenIcon } from 'lucide-react'
import { useSubscription } from '@/hooks/useSubscription'
import { AddressDetectionService } from '@/lib/address-detection'
import { detectDCAPattern } from '@/lib/dca-detection'
import { DCAAnalysis } from '@/components/DCAAnalysis'
import { WalletClusterVisualization } from '@/components/WalletClusterVisualization'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Connection, PublicKey } from '@solana/web3.js'
import { TokenDCAHeatmap } from '@/components/token-dca-heatmap'

// Mock data for development
const MOCK_TOKEN_DATA = {
  metadata: {
    name: "Mock Token",
    symbol: "MOCK",
    decimals: 9,
    supply: "1000000000",
  },
  addressType: {
    type: "Token Program",
    risk: {
      level: "Low",
      reason: "Verified contract with consistent transaction patterns"
    }
  },
  programName: "Token Program v3",
  dcaPatterns: {
    frequency: "Daily",
    averageAmount: 1000,
    consistency: 0.85,
    timePreference: "UTC 12:00-14:00",
    successRate: 0.92
  },
  patterns: {
    temporalAnalysis: {
      averageInterval: 3600, // 1 hour in seconds
      totalTransactions: 1247,
      peakHours: [12, 13, 14],
      lowHours: [2, 3, 4]
    },
    programAnalysis: {
      uniquePrograms: 5,
      topPrograms: [
        { name: "Serum DEX", usage: 45 },
        { name: "Raydium", usage: 30 },
        { name: "Orca", usage: 15 }
      ]
    },
    volumeAnalysis: {
      averageVolume: "50000",
      largestTx: "500000",
      volumeTrend: "Increasing"
    }
  },
  relatedWallets: [
    { address: "mock1...", type: "Trader", strength: 0.8 },
    { address: "mock2...", type: "LP", strength: 0.9 },
    { address: "mock3...", type: "Arbitrage", strength: 0.7 }
  ],
  topWallets: [
    { 
      address: "wallet1...", 
      trades: 156,
      winRate: 0.78,
      pnl: "+45.3%",
      avgSize: "10000"
    },
    { 
      address: "wallet2...", 
      trades: 98,
      winRate: 0.82,
      pnl: "+38.7%",
      avgSize: "25000"
    },
    { 
      address: "wallet3...", 
      trades: 67,
      winRate: 0.71,
      pnl: "+22.4%",
      avgSize: "15000"
    }
  ]
}

export default function TokenAnalysisPage() {
  const { canAccessFeature, currentPlan } = useSubscription()
  const canAccessTokenAnalysis = canAccessFeature('advancedAnalytics')
  const [tokenAddress, setTokenAddress] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [tokenData, setTokenData] = useState<any>(null)
  const { toast } = useToast()

  if (!canAccessTokenAnalysis) {
    return (
      <div className="p-6">
        <Card className="p-6 bg-white/5 border-white/10">
          <h2 className="text-xl font-semibold mb-4">Feature Restricted</h2>
          <p className="text-gray-400 mb-4">
            Token analysis is only available for paid plans. Upgrade your subscription to access this feature.
          </p>
          <Button>Upgrade Now</Button>
        </Card>
      </div>
    )
  }

  const handleAnalyze = async () => {
    if (!tokenAddress) {
      toast({
        title: 'Error',
        description: 'Please enter a token address'
      })
      return
    }

    setIsAnalyzing(true)
    try {
      if (process.env.NODE_ENV === 'development') {
        // Use mock data in development
        await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate API delay
        setTokenData(MOCK_TOKEN_DATA)
      } else {
        const connection = new Connection('https://api.mainnet-beta.solana.com')
        const addressService = new AddressDetectionService('https://api.mainnet-beta.solana.com')
        
        // Get token metadata
        const tokenInfo = await connection.getParsedAccountInfo(new PublicKey(tokenAddress))
        
        // Detect program type and signer
        const addressMetadata = await addressService.detectAddressType(tokenAddress)
        const programName = addressMetadata.program || 'Unknown Program'
        
        // Get DCA patterns
        const dcaPatterns = await detectDCAPattern(tokenAddress)
        
        // Get transaction patterns
        const patterns = await addressService.analyzeTransactionPatterns(tokenAddress)
        
        setTokenData({
          metadata: tokenInfo,
          addressType: addressMetadata,
          programName,
          dcaPatterns,
          patterns,
        })
      }
    } catch (error) {
      console.error('Error analyzing token:', error)
      toast({
        title: 'Error',
        description: 'Failed to analyze token. Please try again.'
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <TokenIcon className="h-8 w-8 text-primary" />
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold"
        >
          Token Analysis
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
              placeholder="Enter token address"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
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
      {tokenData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="overview" className="space-y-8">
            <TabsList className="bg-white/5 border-b border-white/10">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="dca">DCA Analysis</TabsTrigger>
              <TabsTrigger value="relationships">Relationships</TabsTrigger>
              <TabsTrigger value="wallets">Top Wallets</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <Card className="p-6 bg-white/5 border-white/10">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Token Info</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400">Program</p>
                        <p className="font-medium">{tokenData.programName}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Type</p>
                        <p className="font-medium">{tokenData.addressType.type}</p>
                      </div>
                      {tokenData.addressType.risk && (
                        <div>
                          <p className="text-gray-400">Risk Level</p>
                          <p className="font-medium">{tokenData.addressType.risk.level}</p>
                          <p className="text-sm text-gray-400">{tokenData.addressType.risk.reason}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">Transaction Patterns</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400">Average Interval</p>
                        <p className="font-medium">
                          {Math.round(tokenData.patterns.temporalAnalysis.averageInterval / 60)} minutes
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Total Transactions</p>
                        <p className="font-medium">{tokenData.patterns.temporalAnalysis.totalTransactions}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Unique Programs</p>
                        <p className="font-medium">{tokenData.patterns.programAnalysis.uniquePrograms}</p>
                      </div>
                      {tokenData.patterns.volumeAnalysis && (
                        <>
                          <div>
                            <p className="text-gray-400">Average Volume</p>
                            <p className="font-medium">{tokenData.patterns.volumeAnalysis.averageVolume}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Volume Trend</p>
                            <p className="font-medium">{tokenData.patterns.volumeAnalysis.volumeTrend}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {tokenData.patterns.programAnalysis.topPrograms && (
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Top Programs</h3>
                      <div className="space-y-2">
                        {tokenData.patterns.programAnalysis.topPrograms.map((program: any, index: number) => (
                          <div key={index} className="flex justify-between items-center">
                            <p className="font-medium">{program.name}</p>
                            <p className="text-gray-400">{program.usage}% usage</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            {/* DCA Analysis Tab */}
            <TabsContent value="dca">
              <div className="space-y-6">
                <Card className="p-6 bg-white/5 border-white/10">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-4">DCA Pattern Analysis</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-400">Frequency</p>
                          <p className="font-medium">{tokenData.dcaPatterns.frequency}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Average Amount</p>
                          <p className="font-medium">{tokenData.dcaPatterns.averageAmount} tokens</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Consistency Score</p>
                          <p className="font-medium">{(tokenData.dcaPatterns.consistency * 100).toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Success Rate</p>
                          <p className="font-medium">{(tokenData.dcaPatterns.successRate * 100).toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Preferred Time</p>
                          <p className="font-medium">{tokenData.dcaPatterns.timePreference}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
                <TokenDCAHeatmap tokenAddress={tokenAddress} />
                <DCAAnalysis walletAddress={tokenAddress} />
              </div>
            </TabsContent>

            {/* Relationships Tab */}
            <TabsContent value="relationships">
              <Card className="p-6 bg-white/5 border-white/10">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Related Wallets</h3>
                    <div className="space-y-4">
                      {tokenData.relatedWallets?.map((wallet: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                          <div>
                            <p className="font-medium">{wallet.address}</p>
                            <p className="text-sm text-gray-400">{wallet.type}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">Relationship Strength</p>
                            <p className="text-sm text-gray-400">{(wallet.strength * 100).toFixed(1)}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <WalletClusterVisualization wallets={tokenData.relatedWallets || []} />
                </div>
              </Card>
            </TabsContent>

            {/* Top Wallets Tab */}
            <TabsContent value="wallets">
              <Card className="p-6 bg-white/5 border-white/10">
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold mb-4">Top Performing Wallets</h3>
                  <div className="space-y-4">
                    {tokenData.topWallets?.map((wallet: any, index: number) => (
                      <div key={index} className="p-4 rounded-lg bg-white/5">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium">{wallet.address}</p>
                          <p className="text-green-500 font-medium">{wallet.pnl}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400">Total Trades</p>
                            <p>{wallet.trades}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Win Rate</p>
                            <p>{(wallet.winRate * 100).toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Avg Size</p>
                            <p>{wallet.avgSize}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      )}
    </div>
  )
} 