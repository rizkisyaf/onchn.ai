import Redis from 'ioredis-mock'
import { MonitoringService } from '@/lib/services/monitoring'
import { Registry } from 'prom-client'

jest.mock('prom-client', () => ({
  Registry: jest.fn().mockImplementation(() => ({
    metrics: jest.fn().mockResolvedValue('metrics'),
    register: jest.fn(),
    clear: jest.fn(),
  })),
  Counter: jest.fn().mockImplementation(() => ({
    inc: jest.fn(),
  })),
  Gauge: jest.fn().mockImplementation(() => ({
    set: jest.fn(),
  })),
  Histogram: jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
  })),
}))

describe('MonitoringService', () => {
  let monitoring: MonitoringService
  let redis: InstanceType<typeof Redis>
  let registry: Registry

  beforeEach(() => {
    redis = new Redis() as any
    registry = new Registry()
    monitoring = new MonitoringService()
  })

  afterEach(async () => {
    await redis.flushall()
    registry.clear()
  })

  describe('metrics tracking', () => {
    it('should track metrics', async () => {
      const metrics = await monitoring.getMetrics()
      expect(metrics).toBe('metrics')
    })

    it('should track task duration', async () => {
      const duration = 5.5 // seconds
      await monitoring.trackTask({
        id: 'test-task',
        description: 'Test task',
        priority: 1,
        dependencies: [],
        assignedTo: 'test-agent',
        status: 'pending',
        agentId: 'test-agent',
        createdAt: new Date(),
        updatedAt: new Date(),
      }, duration)

      const metrics = await monitoring.getMetrics()
      expect(metrics).toBe('metrics')
    })
  })

  describe('system health', () => {
    it('should return system health metrics', async () => {
      const health = await monitoring.getSystemHealth()

      expect(health).toMatchObject({
        status: 'healthy',
        system: {
          memory: expect.any(Object),
          uptime: expect.any(Number),
        },
      })
    })
  })

  describe('logging', () => {
    it('should log errors', () => {
      const error = new Error('Test error')
      const context = { test: true }

      monitoring.logError(error, context)
    })

    it('should log warnings', () => {
      const message = 'Test warning'
      const context = { test: true }

      monitoring.logWarning(message, context)
    })

    it('should log info', () => {
      const message = 'Test info'
      const context = { test: true }

      monitoring.logInfo(message, context)
    })
  })
}) 