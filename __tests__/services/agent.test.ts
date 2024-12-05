import { PineconeClient } from '@pinecone-database/pinecone'
import { OpenAI } from 'openai'
import { Anthropic } from '@anthropic-ai/sdk'
import Redis from 'ioredis-mock'
import { Queue, Worker } from 'bullmq'
import { AgentService } from '@/lib/services/agent'

// Mock external services
jest.mock('@pinecone-database/pinecone')
jest.mock('openai')
jest.mock('@anthropic-ai/sdk')
jest.mock('bullmq')

describe('AgentService', () => {
  let agentService: AgentService
  let redis: InstanceType<typeof Redis>
  let pinecone: PineconeClient
  let openai: OpenAI
  let anthropic: Anthropic
  let queue: Queue
  let worker: Worker

  beforeEach(() => {
    redis = new Redis() as any
    pinecone = new PineconeClient()
    openai = new OpenAI('test')
    anthropic = new Anthropic({ apiKey: 'test' })
    queue = new Queue('test')
    worker = new Worker('test', async () => {})

    agentService = new AgentService()
  })

  afterEach(async () => {
    await redis.flushall()
    await queue.close()
    await worker.close()
  })

  describe('createAgent', () => {
    it('should create an agent with default values', async () => {
      const agent = await agentService.createAgent({
        name: 'Test Agent',
      })

      expect(agent).toMatchObject({
        name: 'Test Agent',
        role: 'assistant',
        status: 'idle',
        capabilities: [],
        memory: {
          shortTerm: {},
          longTerm: {},
          episodic: [],
        },
      })
      expect(agent.id).toBeDefined()
    })

    it('should create an agent with custom values', async () => {
      const agent = await agentService.createAgent({
        name: 'Test Agent',
        role: 'coder',
        capabilities: [
          {
            name: 'write_code',
            description: 'Write code in any language',
            parameters: {},
          },
        ],
      })

      expect(agent).toMatchObject({
        name: 'Test Agent',
        role: 'coder',
        status: 'idle',
        capabilities: [
          {
            name: 'write_code',
            description: 'Write code in any language',
            parameters: {},
          },
        ],
      })
    })
  })

  describe('findById', () => {
    it('should get agent by id', async () => {
      const created = await agentService.createAgent({
        name: 'Test Agent',
      })

      const agent = await agentService.findById(created.id)
      expect(agent).toMatchObject(created)
    })

    it('should return null for non-existent agent', async () => {
      const agent = await agentService.findById('non-existent')
      expect(agent).toBeNull()
    })
  })

  describe('update', () => {
    it('should update agent properties', async () => {
      const created = await agentService.createAgent({
        name: 'Test Agent',
      })

      const updated = await agentService.update(created.id, {
        name: 'Updated Agent',
        role: 'coder',
      })

      expect(updated).toMatchObject({
        id: created.id,
        name: 'Updated Agent',
        role: 'coder',
      })
    })

    it('should handle non-existent agent', async () => {
      await expect(
        agentService.update('non-existent', {
          name: 'Updated Agent',
        })
      ).rejects.toThrow()
    })
  })

  describe('delete', () => {
    it('should delete agent', async () => {
      const created = await agentService.createAgent({
        name: 'Test Agent',
      })

      await agentService.delete(created.id)
      const agent = await agentService.findById(created.id)
      expect(agent).toBeNull()
    })

    it('should handle non-existent agent', async () => {
      await expect(
        agentService.delete('non-existent')
      ).rejects.toThrow()
    })
  })
}) 