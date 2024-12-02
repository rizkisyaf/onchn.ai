import { Connection, PublicKey } from '@solana/web3.js'
import { QuoteResponse } from '@jup-ag/api'
import { JupiterClient } from '@/lib/trading/jupiter-client'

jest.mock('@solana/web3.js')

describe('JupiterClient', () => {
  let client: JupiterClient
  const mockConnection = new Connection('') as jest.Mocked<Connection>
  const mockUserPublicKey = new PublicKey('11111111111111111111111111111111')

  beforeEach(() => {
    client = new JupiterClient(mockConnection, mockUserPublicKey)
  })

  describe('getRoutes', () => {
    const mockQuoteResponse: QuoteResponse = {
      inputMint: '11111111111111111111111111111111',
      inAmount: '1000000000',
      outputMint: '22222222222222222222222222222222',
      outAmount: '2000000000',
      otherAmountThreshold: '1950000000',
      swapMode: 'ExactIn',
      priceImpactPct: '0.1',
      routePlan: [],
      contextSlot: 0,
      timeTaken: 0,
      slippageBps: 100,
    }

    beforeEach(() => {
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([mockQuoteResponse]),
        })
      )
    })

    it('should return routes with correct format', async () => {
      const routes = await client.getRoutes({
        inputMint: '11111111111111111111111111111111',
        outputMint: '22222222222222222222222222222222',
        amount: 1,
        slippage: 0.01,
      })

      expect(routes).toHaveLength(1)
      expect(routes[0]).toEqual({
        routeInfo: mockQuoteResponse,
        outAmount: 2,
        fee: 1.95,
        priceImpact: 0.1,
      })
    })

    it('should handle API errors', async () => {
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: false,
        })
      )

      await expect(
        client.getRoutes({
          inputMint: '11111111111111111111111111111111',
          outputMint: '22222222222222222222222222222222',
          amount: 1,
          slippage: 0.01,
        })
      ).rejects.toThrow('Failed to get routes')
    })
  })

  describe('executeSwap', () => {
    const mockQuoteResponse: QuoteResponse = {
      inputMint: '11111111111111111111111111111111',
      inAmount: '1000000000',
      outputMint: '22222222222222222222222222222222',
      outAmount: '2000000000',
      otherAmountThreshold: '1950000000',
      swapMode: 'ExactIn',
      priceImpactPct: '0.1',
      routePlan: [],
      contextSlot: 0,
      timeTaken: 0,
      slippageBps: 100,
    }

    const mockRoute = {
      routeInfo: mockQuoteResponse,
      outAmount: 2,
      fee: 1.95,
      priceImpact: 0.1,
    }

    beforeEach(() => {
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              swapTransaction: Buffer.from('mock_transaction').toString('base64'),
            }),
        })
      )

      mockConnection.sendTransaction = jest.fn().mockResolvedValue('mock_txid')
      mockConnection.confirmTransaction = jest.fn().mockResolvedValue({
        value: { err: null },
      })
    })

    it('should execute swap successfully', async () => {
      const txid = await client.executeSwap(mockRoute)
      expect(txid).toBe('mock_txid')
    })

    it('should handle transaction failure', async () => {
      mockConnection.confirmTransaction = jest.fn().mockResolvedValue({
        value: { err: 'Transaction failed' },
      })

      await expect(client.executeSwap(mockRoute)).rejects.toThrow(
        'Transaction failed'
      )
    })

    it('should handle API errors', async () => {
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: false,
        })
      )

      await expect(client.executeSwap(mockRoute)).rejects.toThrow(
        'Failed to get swap transaction'
      )
    })
  })

  describe('getTokenInfo', () => {
    const mockToken = {
      address: '11111111111111111111111111111111',
      symbol: 'TEST',
      decimals: 9,
    }

    beforeEach(async () => {
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([mockToken]),
        })
      )

      await client.init()
    })

    it('should return token info', async () => {
      const tokenInfo = await client.getTokenInfo(
        '11111111111111111111111111111111'
      )
      expect(tokenInfo).toEqual(mockToken)
    })

    it('should return undefined for unknown token', async () => {
      const tokenInfo = await client.getTokenInfo(
        '99999999999999999999999999999999'
      )
      expect(tokenInfo).toBeUndefined()
    })
  })
}) 