export interface Trade {
  type: 'send' | 'receive' | 'swap'
  value: number
  token: string
  timestamp: number
}