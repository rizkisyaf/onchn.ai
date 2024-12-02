import { useState, useCallback, useEffect } from 'react'
import { Connection, PublicKey } from '@solana/web3.js'
import { AutoTrader, TradeParams, TradeResult } from '@/lib/trading/auto-trader'
import { useWallet } from '@solana/wallet-adapter-react'

export interface AutoTraderHookResult {
  isTrading: boolean
  error: string | null
  lastTrade: TradeResult | null
  parameters: TradeParams | null
  startTrading: (params: TradeParams) => Promise<void>
  stopTrading: () => void
  updateParameters: (params: Partial<TradeParams>) => void
  executeNextTrade: () => Promise<void>
}

export function useAutoTrader(): AutoTraderHookResult {
  const [isTrading, setIsTrading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastTrade, setLastTrade] = useState<TradeResult | null>(null)
  const [parameters, setParameters] = useState<TradeParams | null>(null)
  const [autoTrader, setAutoTrader] = useState<AutoTrader | null>(null)

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const connection = new Connection('https://api.devnet.solana.com')
      const userPublicKey = new PublicKey('11111111111111111111111111111111')
      const trader = new AutoTrader(connection, userPublicKey)
      setAutoTrader(trader)
      return
    }

    // Production setup
    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL!,
      { commitment: 'confirmed' }
    )
    const wallet = useWallet() // Assuming you're using @solana/wallet-adapter
    
    if (wallet.publicKey) {
      const trader = new AutoTrader(connection, wallet.publicKey)
      trader.init().then(() => setAutoTrader(trader))
    }
  }, [])

  const startTrading = useCallback(
    async (params: TradeParams) => {
      if (!autoTrader) return

      setIsTrading(true)
      setError(null)
      setParameters(params)

      try {
        const result = await autoTrader.executeTradeStrategy(params)
        if (result.success) {
          setLastTrade(result)
        } else {
          setError(result.error || 'Trade failed')
          setIsTrading(false)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setIsTrading(false)
      }
    },
    [autoTrader]
  )

  const stopTrading = useCallback(() => {
    setIsTrading(false)
  }, [])

  const updateParameters = useCallback((newParams: Partial<TradeParams>) => {
    setParameters(prev => {
      if (!prev) return null
      return { ...prev, ...newParams }
    })
  }, [])

  const executeNextTrade = useCallback(async () => {
    if (!autoTrader || !parameters || !isTrading) return

    try {
      const result = await autoTrader.executeTradeStrategy(parameters)
      if (result.success) {
        setLastTrade(result)
      } else {
        setError(result.error || 'Trade failed')
        setIsTrading(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setIsTrading(false)
    }
  }, [autoTrader, parameters, isTrading])

  return {
    isTrading,
    error,
    lastTrade,
    parameters,
    startTrading,
    stopTrading,
    updateParameters,
    executeNextTrade,
  }
} 