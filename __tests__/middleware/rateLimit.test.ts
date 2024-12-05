import Redis from 'ioredis-mock'
import { rateLimit, getRateLimitInfo, resetRateLimit } from '@/lib/middleware/rateLimit'
import { NextApiRequest, NextApiResponse } from 'next'
import { Socket } from 'net'

class MockSocket {
  remoteAddress: string = '127.0.0.1'
}

class MockRequest implements Partial<NextApiRequest> {
  url: string
  method: string
  headers: { [key: string]: string }
  socket: { remoteAddress: string }

  constructor(url: string) {
    this.url = url
    this.method = 'GET'
    this.headers = {}
    this.socket = { remoteAddress: '127.0.0.1' }
  }
}

class MockResponse implements Partial<NextApiResponse> {
  statusCode: number = 200
  headers: { [key: string]: string | string[] } = {}

  status(code: number) {
    this.statusCode = code
    return this
  }

  setHeader(name: string, value: string | string[]) {
    this.headers[name] = value
    return this
  }

  json(body: any) {
    return Promise.resolve(body)
  }

  getHeader(name: string) {
    return this.headers[name]
  }

  end() {}
}

describe('Rate Limiting', () => {
  let redis: InstanceType<typeof Redis>

  beforeEach(() => {
    redis = new Redis() as any
  })

  afterEach(async () => {
    await redis.flushall()
  })

  it('should allow requests within rate limit', async () => {
    const req = new MockRequest('http://localhost/api/test')
    const res = new MockResponse()

    const result = await rateLimit(req as NextApiRequest, res as NextApiResponse)
    expect(result?.statusCode).toBe(200)
  })

  it('should block requests exceeding rate limit', async () => {
    const req = new MockRequest('http://localhost/api/test')
    const res = new MockResponse()

    // Make multiple requests
    for (let i = 0; i < 10; i++) {
      await rateLimit(req as NextApiRequest, res as NextApiResponse)
    }

    const result = await rateLimit(req as NextApiRequest, res as NextApiResponse)
    expect(result?.statusCode).toBe(429)
  })

  it('should return rate limit info', async () => {
    const req = new MockRequest('http://localhost/api/test')
    const res = new MockResponse()

    await rateLimit(req as NextApiRequest, res as NextApiResponse)
    const info = await getRateLimitInfo(req.socket.remoteAddress, req.url)

    expect(info).toMatchObject({
      remainingPoints: expect.any(Number),
      msBeforeNext: expect.any(Number),
      isBlocked: expect.any(Boolean),
    })
  })

  it('should reset rate limit', async () => {
    const req = new MockRequest('http://localhost/api/test')
    const res = new MockResponse()

    // Make some requests
    await rateLimit(req as NextApiRequest, res as NextApiResponse)
    await rateLimit(req as NextApiRequest, res as NextApiResponse)

    // Reset limit
    await resetRateLimit(req.socket.remoteAddress, req.url)

    // Check if limit was reset
    const info = await getRateLimitInfo(req.socket.remoteAddress, req.url)
    expect(info?.remainingPoints).toBe(10)
  })
}) 