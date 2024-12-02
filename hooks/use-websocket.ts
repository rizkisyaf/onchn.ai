import { useEffect, useRef, useState } from 'react'
import { WebSocketClient, WebSocketEvent } from '@/lib/websocket-client'

interface WebSocketOptions {
  onOpen?: () => void
  onClose?: () => void
  onError?: (error: Error) => void
  onPrice?: (price: number) => void
  onTrade?: (trade: any) => void
  onToken?: (token: any) => void
  onWallet?: (wallet: any) => void
}

export function useWebSocket(apiKey: string, options: WebSocketOptions = {}) {
  const wsRef = useRef<WebSocketClient | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const ws = new WebSocketClient(apiKey)
    wsRef.current = ws

    ws.on('connected', () => {
      setIsConnected(true)
      options.onOpen?.()
    })

    ws.on('disconnected', () => {
      setIsConnected(false)
      options.onClose?.()
    })

    ws.on('error', (error) => {
      setError(error.wsError)
      options.onError?.(error.wsError)
    })

    ws.on('price', (data: WebSocketEvent<{ price: number }>['data']) => {
      options.onPrice?.(data.price)
    })

    ws.on('trade', (data: WebSocketEvent<any>['data']) => {
      options.onTrade?.(data)
    })

    ws.on('token', (data: WebSocketEvent<any>['data']) => {
      options.onToken?.(data)
    })

    ws.on('wallet', (data: WebSocketEvent<any>['data']) => {
      options.onWallet?.(data)
    })

    ws.connect()

    return () => {
      ws.disconnect()
    }
  }, [apiKey, options])

  const subscribe = (channel: string, params: Record<string, unknown> = {}) => {
    wsRef.current?.subscribe(channel, params)
  }

  const unsubscribe = (channel: string, params: Record<string, unknown> = {}) => {
    wsRef.current?.unsubscribe(channel, params)
  }

  return {
    isConnected,
    error,
    subscribe,
    unsubscribe,
  }
} 