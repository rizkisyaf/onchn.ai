import { Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js'
import { QuoteResponse, SwapResponse } from '@jup-ag/api'

export interface SwapParams {
  inputMint: string
  outputMint: string
  amount: number
  slippage: number
  onlyDirectRoutes?: boolean
  maxAccounts?: number
}

export interface SwapRoute {
  routeInfo: QuoteResponse
  outAmount: number
  fee: number
  priceImpact: number
}

export interface JupiterClientOptions {
  platformFeeBps?: number;
  feeAccount?: string;
}

export class JupiterClient {
  private apiUrl = 'https://quote-api.jup.ag/v6'
  private tokenList: any[] = []

  constructor(
    private connection: Connection,
    private userPublicKey: PublicKey,
    private options: JupiterClientOptions = {}
  ) {}

  async init() {
    // Load token list
    const response = await fetch('https://token.jup.ag/all')
    this.tokenList = await response.json()
  }

  async getRoutes(params: SwapParams): Promise<SwapRoute[]> {
    const { inputMint, outputMint, amount, slippage, onlyDirectRoutes = false, maxAccounts = 5 } = params

    // Get quote
    const response = await fetch(`${this.apiUrl}/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputMint,
        outputMint,
        amount: Math.floor(amount * 1e9).toString(),
        slippageBps: Math.floor(slippage * 100),
        onlyDirectRoutes,
        maxAccounts,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to get routes')
    }

    const quotes: QuoteResponse[] = await response.json()
    
    return quotes.map(quote => ({
      routeInfo: quote,
      outAmount: Number(quote.outAmount) / 1e9,
      fee: Number(quote.otherAmountThreshold) / 1e9,
      priceImpact: Number(quote.priceImpactPct),
    }))
  }

  async executeSwap(route: SwapRoute): Promise<string> {
    const swapResponse = await fetch(`${this.apiUrl}/swap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse: route.routeInfo,
        userPublicKey: this.userPublicKey.toString(),
        wrapAndUnwrapSol: true,
        asLegacyTransaction: true,
        feeAccount: this.options.feeAccount,
        platformFeeBps: this.options.platformFeeBps,
        prioritizationFeeLamports: "auto",
        dynamicComputeUnitLimit: true
      }),
    });

    if (!swapResponse.ok) {
      throw new Error('Failed to get swap transaction');
    }

    const { swapTransaction }: SwapResponse = await swapResponse.json();
    const transaction = Transaction.from(Buffer.from(swapTransaction, 'base64'));
    
    const txid = await this.connection.sendTransaction(transaction, []);
    const confirmation = await this.connection.confirmTransaction(txid, 'confirmed');
    
    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${confirmation.value.err}`);
    }

    return txid;
  }

  async getTokenInfo(mint: string) {
    return this.tokenList.find(token => token.address === mint)
  }

  // Helper method to get best route
  async getBestRoute(params: SwapParams): Promise<SwapRoute | null> {
    const routes = await this.getRoutes(params)
    if (routes.length === 0) return null

    // Sort by output amount and price impact
    return routes.sort((a, b) => {
      // Prioritize routes with higher output
      const outputDiff = b.outAmount - a.outAmount
      if (Math.abs(outputDiff) > 0.01) return outputDiff

      // If outputs are similar, prefer lower price impact
      return a.priceImpact - b.priceImpact
    })[0]
  }

  // Helper method to validate slippage
  validateSlippage(slippage: number): boolean {
    // Slippage should be between 0.1% and 5%
    return slippage >= 0.001 && slippage <= 0.05
  }

  // Helper method to check if a token is supported
  async isTokenSupported(mint: string): Promise<boolean> {
    return this.tokenList.some(token => token.address === mint)
  }
} 