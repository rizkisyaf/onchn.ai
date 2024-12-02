import { AgentService } from '@/lib/services/agent';
import { Agent, AgentTask, AgentMessage } from '@/types/agent';
import { Redis } from 'ioredis-mock';
import { PineconeClient } from '@pinecone-database/pinecone';

// Mock external services
jest.mock('ioredis', () => require('ioredis-mock'));
jest.mock('@pinecone-database/pinecone');
jest.mock('openai');
jest.mock('@anthropic-ai/sdk');

describe('AgentService', () => {
  let agentService: AgentService;

  beforeEach(() => {
    agentService = new AgentService();
  });

  describe('createAgent', () => {
    it('should create an agent with default values', async () => {
      const agent = await agentService.createAgent({
        name: 'Test Agent',
      });

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
      });
      expect(agent.id).toBeDefined();
    });

    it('should create an agent with custom values', async () => {
      const agent = await agentService.createAgent({
        name: 'Test Agent',
        role: 'coder',
        capabilities: [
          {
            name: 'write_code',
            description: 'Write code in any language',
            parameters: {},
            handler: async () => ({}),
          },
        ],
      });

      expect(agent).toMatchObject({
        name: 'Test Agent',
        role: 'coder',
        status: 'idle',
        capabilities: [
          {
            name: 'write_code',
            description: 'Write code in any language',
          },
        ],
      });
    });
  });

  describe('assignTask', () => {
    let agent: Agent;

    beforeEach(async () => {
      agent = await agentService.createAgent({
        name: 'Test Agent',
      });
    });

    it('should assign a task to an agent', async () => {
      const task = await agentService.assignTask(agent.id, {
        description: 'Test task',
        priority: 1,
      });

      expect(task).toMatchObject({
        description: 'Test task',
        priority: 1,
        status: 'pending',
        assignedTo: agent.id,
      });
      expect(task.id).toBeDefined();
      expect(task.created).toBeDefined();
      expect(task.updated).toBeDefined();
    });

    it('should throw error when agent not found', async () => {
      await expect(
        agentService.assignTask('non-existent', {
          description: 'Test task',
        })
      ).rejects.toThrow('Agent not found');
    });
  });

  describe('memory management', () => {
    let agent: Agent;

    beforeEach(async () => {
      agent = await agentService.createAgent({
        name: 'Test Agent',
      });
    });

    it('should store and retrieve memory', async () => {
      const memory = {
        type: 'shortTerm',
        content: { key: 'value' },
      };

      const vectorId = await agentService.storeMemory(agent.id, memory);
      expect(vectorId).toBeDefined();

      const memories = await agentService.searchMemory(agent.id, 'value');
      expect(memories).toHaveLength(1);
      expect(memories[0].metadata).toMatchObject(memory);
    });

    it('should update agent memory with events', async () => {
      await agentService.updateAgentMemory(agent.id, {
        action: 'test_action',
        context: { data: 'test' },
      });

      const updatedAgent = await agentService['agents'].get(agent.id);
      expect(updatedAgent?.memory.episodic).toHaveLength(1);
      expect(updatedAgent?.memory.episodic[0]).toMatchObject({
        action: 'test_action',
        context: { data: 'test' },
      });
    });
  });

  describe('message handling', () => {
    let sourceAgent: Agent;
    let targetAgent: Agent;

    beforeEach(async () => {
      sourceAgent = await agentService.createAgent({
        name: 'Source Agent',
      });
      targetAgent = await agentService.createAgent({
        name: 'Target Agent',
      });
    });

    it('should send and process messages between agents', async () => {
      const message: AgentMessage = {
        id: 'test-message',
        agentId: targetAgent.id,
        content: 'Hello',
        type: 'text',
        timestamp: Date.now(),
      };

      await agentService.sendMessage(message);

      // Check that message was processed
      const targetAgentMemory = await agentService['agents'].get(targetAgent.id);
      expect(targetAgentMemory?.memory.episodic).toHaveLength(1);
      expect(targetAgentMemory?.memory.episodic[0]).toMatchObject({
        action: 'message_received',
        context: {
          messageId: message.id,
          content: message.content,
          type: message.type,
        },
      });
    });
  });

  describe('task execution', () => {
    let agent: Agent;

    beforeEach(async () => {
      agent = await agentService.createAgent({
        name: 'Test Agent',
        role: 'coder',
      });
    });

    it('should execute tasks based on agent role', async () => {
      const task: AgentTask = {
        id: 'test-task',
        description: 'Write a hello world program',
        priority: 1,
        dependencies: [],
        assignedTo: agent.id,
        status: 'pending',
        created: Date.now(),
        updated: Date.now(),
      };

      const result = await agentService['executeTask'](agent, task);
      expect(result).toBeDefined();
    });

    it('should handle task execution errors', async () => {
      const task: AgentTask = {
        id: 'test-task',
        description: 'Invalid task',
        priority: 1,
        dependencies: [],
        assignedTo: agent.id,
        status: 'pending',
        created: Date.now(),
        updated: Date.now(),
      };

      // Mock executeCodeTask to throw error
      jest.spyOn(agentService as any, 'executeCodeTask').mockRejectedValue(
        new Error('Task execution failed')
      );

      await expect(agentService['executeTask'](agent, task)).rejects.toThrow(
        'Task execution failed'
      );

      const updatedAgent = await agentService['agents'].get(agent.id);
      expect(updatedAgent?.status).toBe('error');
    });
  });
}); 