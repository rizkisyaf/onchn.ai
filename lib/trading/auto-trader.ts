import { ConfirmedSignatureInfo, Connection, ParsedAccountData, PublicKey } from '@solana/web3.js'
import { JupiterClient } from './jupiter-client'
import { BehaviorModel, WalletState, TradeAction } from '../ai/behavior-model'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Token } from '@/types/wallet'

export interface TradeParams {
  walletAddress: string
  maxAmount: number
  slippage: number
}

export interface TradeResult {
  success: boolean
  txid?: string
  type?: TradeAction['type']
  token?: string
  amount?: number
  confidence?: number
  error?: string
}

export class AutoTrader {
  private jupiterClient: JupiterClient
  private behaviorModel: BehaviorModel
  private connection: Connection

  constructor(connection: Connection, userPublicKey: PublicKey) {
    this.connection = connection
    this.jupiterClient = new JupiterClient(connection, userPublicKey)
    this.behaviorModel = new BehaviorModel()
  }

  async init() {
    await this.jupiterClient.init()
  }

  async executeTradeStrategy(params: TradeParams): Promise<TradeResult> {
    try {
      const state = await this.getWalletState(params.walletAddress)
      const prediction = await this.behaviorModel.predict(state)

      if (prediction.confidence < 0.7) {
        return {
          success: false,
          error: 'Low confidence prediction',
        }
      }

      const routes = await this.jupiterClient.getRoutes({
        inputMint: prediction.token,
        outputMint: prediction.token,
        amount: Math.min(prediction.amount, params.maxAmount),
        slippage: params.slippage,
      })

      if (routes.length === 0) {
        return {
          success: false,
          error: 'No routes available for trade',
        }
      }

      const bestRoute = routes[0]
      const txid = await this.jupiterClient.executeSwap(bestRoute)

      return {
        success: true,
        txid,
        type: prediction.type,
        token: prediction.token,
        amount: prediction.amount,
        confidence: prediction.confidence,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private async getWalletState(walletAddress: string): Promise<WalletState> {
    if (process.env.NODE_ENV === 'development') {
      return {
        transactionCount: 100,
        uniqueTokens: 5,
        avgTransactionValue: 1000,
        tradeFrequency: 0.5,
        profitRatio: 1.2,
        riskLevel: 0.3,
        timeInMarket: 180 * 24 * 60 * 60 * 1000,
        totalInflow: 5000,
        totalOutflow: 4000,
        lastActivity: Date.now(),
        tokens: [],
        stats: {
          totalValue: 1000,
          totalTransactions: 100,
          uniqueTokens: 5,
          avgTransactionValue: 1000,
          lastActivity: Date.now()
        }
      }
    }

    // Real production logic
    const transactions = await this.connection.getSignaturesForAddress(new PublicKey(walletAddress))
    const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
      new PublicKey(walletAddress),
      { programId: TOKEN_PROGRAM_ID }
    )

    const state: WalletState = {
      transactionCount: transactions.length,
      uniqueTokens: tokenAccounts.value.length,
      avgTransactionValue: await this.calculateAvgTransactionValue(transactions),
      tradeFrequency: this.calculateTradeFrequency(transactions),
      profitRatio: await this.calculateProfitRatio(transactions),
      riskLevel: await this.calculateRiskLevel(transactions),
      timeInMarket: Date.now() - transactions[transactions.length - 1].blockTime! * 1000,
      totalInflow: await this.calculateTotalInflow(transactions),
      totalOutflow: await this.calculateTotalOutflow(transactions),
      lastActivity: transactions[0].blockTime! * 1000,
      tokens: await this.getTokenDetails(tokenAccounts),
      stats: {
        totalValue: await this.calculateTotalValue(tokenAccounts),
        totalTransactions: transactions.length,
        uniqueTokens: tokenAccounts.value.length,
        avgTransactionValue: await this.calculateAvgTransactionValue(transactions),
        lastActivity: transactions[0].blockTime! * 1000
      }
    }

    return state
  }

  private async calculateAvgTransactionValue(transactions: ConfirmedSignatureInfo[]): Promise<number> {
    const txDetails = await Promise.all(
      transactions.slice(0, 100).map(tx => this.connection.getTransaction(tx.signature))
    )
    const values = txDetails.map(tx => tx?.meta?.fee || 0)
    return values.reduce((sum, val) => sum + val, 0) / values.length
  }

  private calculateTradeFrequency(transactions: ConfirmedSignatureInfo[]): number {
    if (transactions.length < 2) return 0
    const timeSpan = transactions[0].blockTime! - transactions[transactions.length - 1].blockTime!
    return transactions.length / (timeSpan / (24 * 60 * 60))
  }

  private async calculateProfitRatio(transactions: ConfirmedSignatureInfo[]): Promise<number> {
    const txDetails = await Promise.all(
      transactions.slice(0, 100).map(tx => this.connection.getTransaction(tx.signature))
    )
    const inflow = txDetails.reduce((sum, tx) => sum + (tx?.meta?.preBalances[0] || 0), 0)
    const outflow = txDetails.reduce((sum, tx) => sum + (tx?.meta?.postBalances[0] || 0), 0)
    return outflow / (inflow || 1)
  }

  private async calculateRiskLevel(transactions: ConfirmedSignatureInfo[]): Promise<number> {
    const txDetails = await Promise.all(
      transactions.slice(0, 100).map(tx => this.connection.getTransaction(tx.signature))
    )
    const volatility = this.calculateVolatility(txDetails)
    const frequency = this.calculateTradeFrequency(transactions)
    return Math.min(volatility * frequency / 100, 1)
  }

  private async calculateTotalInflow(transactions: ConfirmedSignatureInfo[]): Promise<number> {
    const txDetails = await Promise.all(
      transactions.slice(0, 100).map(tx => this.connection.getTransaction(tx.signature))
    )
    return txDetails.reduce((sum, tx) => sum + (tx?.meta?.preBalances[0] || 0), 0)
  }

  private async calculateTotalOutflow(transactions: ConfirmedSignatureInfo[]): Promise<number> {
    const txDetails = await Promise.all(
      transactions.slice(0, 100).map(tx => this.connection.getTransaction(tx.signature))
    )
    return txDetails.reduce((sum, tx) => sum + (tx?.meta?.postBalances[0] || 0), 0)
  }

  private async getTokenDetails(tokenAccounts: ParsedAccountData[]): Promise<Token[]> {
    return Promise.all(
      tokenAccounts.map(async account => {
        const mintInfo = await this.connection.getParsedAccountInfo(account.data.parsed.info.mint)
        return {
          address: account.data.parsed.info.mint,
          symbol: mintInfo.value?.data.parsed.info.symbol || 'UNKNOWN',
          name: mintInfo.value?.data.parsed.info.name || 'Unknown Token',
          decimals: account.data.parsed.info.tokenAmount.decimals,
          balance: Number(account.data.parsed.info.tokenAmount.amount),
          value: 0, // To be calculated with price feed
          price: 0, // To be fetched from price feed
          change24h: 0 // To be fetched from price feed
        }
      })
    )
  }

  private async calculateTotalValue(tokenAccounts: ParsedAccountData[]): Promise<number> {
    const tokens = await this.getTokenDetails(tokenAccounts)
    return tokens.reduce((sum, token) => sum + token.value, 0)
  }
} 