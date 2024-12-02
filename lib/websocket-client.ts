import { EventEmitter } from 'events'
import ReconnectingWebSocket from 'reconnecting-websocket'

export interface WebSocketEvent<T = unknown> {
  type: 'price' | 'trade' | 'token' | 'wallet'
  data: T
}

export interface WebSocketErrorEvent {
  originalEvent: ErrorEvent
  wsError: Error
  wsMessage: string
  wsType: string
}

export interface WebSocketOptions {
  connectionTimeout: number
  maxRetries: number
  reconnectionDelayGrowFactor: number
  minReconnectionDelay: number
  maxReconnectionDelay: number
}

export class WebSocketClient extends EventEmitter {
  private ws: ReconnectingWebSocket | null = null
  private subscriptions: Set<string> = new Set()
  private reconnectAttempts = 0
  private readonly maxReconnectAttempts = 5
  private readonly reconnectInterval = 1000 // 1 second

  constructor(private apiKey: string) {
    super()
  }

  connect() {
    if (this.ws) return

    const options: WebSocketOptions = {
      connectionTimeout: 4000,
      maxRetries: this.maxReconnectAttempts,
      reconnectionDelayGrowFactor: 1.3,
      minReconnectionDelay: this.reconnectInterval,
      maxReconnectionDelay: 10000,
    }

    this.ws = new ReconnectingWebSocket(
      `wss://data.solanatracker.io/ws?apiKey=${this.apiKey}`,
      [],
      options as any
    )

    this.ws.addEventListener('open', this.handleOpen)
    this.ws.addEventListener('message', this.handleMessage)
    this.ws.addEventListener('close', this.handleClose)
    this.ws.addEventListener('error', (event: Event) => {
      if (event instanceof ErrorEvent) {
        this.handleError(event)
      } else {
        this.handleError(new ErrorEvent('error', {
          error: new Error('Unknown WebSocket error'),
          message: 'Unknown error occurred',
        }))
      }
    })
  }

  disconnect() {
    if (!this.ws) return
    this.ws.close()
    this.ws = null
    this.subscriptions.clear()
    this.reconnectAttempts = 0
  }

  subscribe(channel: string, params: Record<string, unknown> = {}) {
    const subscription = JSON.stringify({ channel, ...params })
    if (this.subscriptions.has(subscription)) return

    this.subscriptions.add(subscription)
    if (this.ws && this.ws.readyState === 1) { // 1 = OPEN
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        channel,
        params,
      }))
    }
  }

  unsubscribe(channel: string, params: Record<string, unknown> = {}) {
    const subscription = JSON.stringify({ channel, ...params })
    if (!this.subscriptions.has(subscription)) return

    this.subscriptions.delete(subscription)
    if (this.ws && this.ws.readyState === 1) { // 1 = OPEN
      this.ws.send(JSON.stringify({
        type: 'unsubscribe',
        channel,
        params,
      }))
    }
  }

  private handleOpen = () => {
    this.reconnectAttempts = 0
    this.emit('connected')

    this.subscriptions.forEach(subscription => {
      const { channel, ...params } = JSON.parse(subscription)
      this.subscribe(channel, params)
    })
  }

  private handleMessage = (event: MessageEvent) => {
    try {
      const message: WebSocketEvent = JSON.parse(event.data)
      this.emit(message.type, message.data)
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
    }
  }

  private handleClose = () => {
    this.emit('disconnected')
    this.reconnectAttempts++

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('max_reconnect_attempts')
    }
  }

  private handleError = (event: ErrorEvent) => {
    const wsError: WebSocketErrorEvent = {
      originalEvent: event,
      wsError: event.error || new Error('Unknown WebSocket error'),
      wsMessage: event.message || 'Unknown error message',
      wsType: 'error'
    }
    console.error('WebSocket error:', wsError)
    this.emit('error', wsError)
  }

  // Subscription helpers
  subscribeToPrice(tokenAddress: string) {
    this.subscribe('price', { token: tokenAddress })
  }

  subscribeToTrades(tokenAddress: string, poolAddress?: string) {
    this.subscribe('trades', { token: tokenAddress, pool: poolAddress })
  }

  subscribeToWallet(walletAddress: string) {
    this.subscribe('wallet', { address: walletAddress })
  }

  unsubscribeFromPrice(tokenAddress: string) {
    this.unsubscribe('price', { token: tokenAddress })
  }

  unsubscribeFromTrades(tokenAddress: string, poolAddress?: string) {
    this.unsubscribe('trades', { token: tokenAddress, pool: poolAddress })
  }

  unsubscribeFromWallet(walletAddress: string) {
    this.unsubscribe('wallet', { address: walletAddress })
  }
} 