import { AutoTrader } from '@/lib/trading/auto-trader'
import { Connection, PublicKey } from '@solana/web3.js'
import { BehaviorModel } from '@/lib/ai/behavior-model'
import { JupiterClient } from '@/lib/trading/jupiter-client'

jest.mock('@solana/web3.js')
jest.mock('@/lib/ai/behavior-model')
jest.mock('@/lib/trading/jupiter-client')

describe('AutoTrader', () => {
  let autoTrader: AutoTrader
  let connection: Connection
  let publicKey: PublicKey
  let behaviorModel: BehaviorModel
  let jupiterClient: JupiterClient

  beforeEach(() => {
    connection = new Connection('mock-url')
    publicKey = new PublicKey('mock-key')
    behaviorModel = new BehaviorModel()
    jupiterClient = new JupiterClient(connection, publicKey)

    // Mock behavior model predictions
    ;(behaviorModel.predict as jest.Mock).mockResolvedValue({
      type: 'buy',
      token: 'SOL',
      amount: 1,
      confidence: 0.9,
    })

    // Mock Jupiter client
    ;(jupiterClient.executeSwap as jest.Mock).mockResolvedValue({
      success: true,
      txid: 'mock-transaction-signature',
    })

    // Mock connection methods
    ;(connection.getParsedTokenAccountsByOwner as jest.Mock).mockResolvedValue({
      value: [{
        pubkey: new PublicKey('mock-token-account'),
        account: {
          data: {
            parsed: {
              info: {
                mint: new PublicKey('mock-mint'),
                tokenAmount: {
                  amount: '1000000000',
                  decimals: 9,
                },
              },
            },
          },
        },
      }],
    })

    ;(connection.getTokenAccountBalance as jest.Mock).mockResolvedValue({
      value: {
        amount: '1000000000',
        decimals: 9,
      },
    })

    ;(connection.getRecentBlockhash as jest.Mock).mockResolvedValue({
      blockhash: 'mock-blockhash',
      lastValidBlockHeight: 1000,
    })

    ;(connection.sendTransaction as jest.Mock).mockResolvedValue('mock-transaction-signature')
    ;(connection.confirmTransaction as jest.Mock).mockResolvedValue({ value: { err: null } })

    autoTrader = new AutoTrader(connection, publicKey)
    autoTrader['behaviorModel'] = behaviorModel
    autoTrader['jupiterClient'] = jupiterClient
    ;(autoTrader as any).tokenList = [{
      address: 'mock-mint',
      symbol: 'SOL',
      decimals: 9,
      name: 'Solana',
      tags: ['token'],
    }]
  })

  it('should execute trades based on model predictions', async () => {
    const result = await autoTrader.executeTradeStrategy({
      walletAddress: 'mock-key',
      maxAmount: 1,
      slippage: 0.01,
    })

    expect(result).toEqual({
      success: true,
      txid: 'mock-transaction-signature',
      action: 'buy',
      token: 'SOL',
      amount: 1,
      confidence: 0.9,
    })
  })

  it('should handle trade execution errors', async () => {
    // Mock behavior model to predict a trade that will fail
    ;(behaviorModel.predict as jest.Mock).mockResolvedValue({
      type: 'buy',
      token: 'INVALID',
      amount: 1,
      confidence: 0.9,
    })

    // Mock Jupiter client error
    ;(jupiterClient.executeSwap as jest.Mock).mockRejectedValue(new Error('No route found'))

    const result = await autoTrader.executeTradeStrategy({
      walletAddress: 'mock-key',
      maxAmount: 1,
      slippage: 0.01,
    })

    expect(result).toEqual({
      success: false,
      error: 'No route found',
    })
  })
}) 