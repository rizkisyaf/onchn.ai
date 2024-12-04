import { PineconeClient } from '@pinecone-database/pinecone';
import { OpenAI } from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import Redis from 'ioredis';
import { Queue, Worker } from 'bullmq';
import { Agent, AgentTask, AgentMessage } from '../types/agent';

const openai = new OpenAI(process.env.OPENAI_API_KEY!);
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const redis = new Redis(process.env.REDIS_URL!);
const taskQueue = new Queue('agent-tasks', { connection: redis });
const messageQueue = new Queue('agent-messages', { connection: redis });

export class AgentService {
  private pinecone: PineconeClient;
  private agents: Map<string, Agent>;
  private messageHandlers: Map<string, (message: AgentMessage) => Promise<void>>;

  constructor() {
    this.pinecone = new PineconeClient();
    this.agents = new Map();
    this.messageHandlers = new Map();
    this.initializeWorkers();
  }

  async initialize() {
    await this.pinecone.init({
      environment: process.env.PINECONE_ENV!,
      apiKey: process.env.PINECONE_API_KEY!,
    });
  }

  private initializeWorkers() {
    // Task worker
    new Worker('agent-tasks', async (job) => {
      const task = job.data as AgentTask;
      const agent = this.agents.get(task.agentId);
      
      if (!agent) throw new Error('Agent not found');
      
      try {
        agent.status = 'working';
        agent.currentTask = {
          id: task.id,
          description: task.description,
          startTime: Date.now(),
          progress: 0,
        };

        // Execute task based on agent role
        const result = await this.executeTask(agent, task);
        
        // Update memory
        await this.updateAgentMemory(agent.id, {
          action: 'task_completed',
          context: { taskId: task.id, result },
        });

        return result;
      } catch (error) {
        agent.status = 'error';
        throw error;
      } finally {
        agent.status = 'idle';
        agent.currentTask = undefined;
      }
    });

    // Message worker
    new Worker('agent-messages', async (job) => {
      const message = job.data as AgentMessage;
      const handler = this.messageHandlers.get(message.agentId);
      
      if (handler) {
        await handler(message);
      }
    });
  }

  async createAgent(agentData: Partial<Agent>): Promise<Agent> {
    const agent: Agent = {
      id: crypto.randomUUID(),
      name: agentData.name || 'Agent',
      role: agentData.role || 'assistant',
      capabilities: agentData.capabilities || [],
      tasks: [],
      memory: {
        shortTerm: {},
        longTerm: {},
        episodic: [],
      },
      status: 'idle',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...agentData,
    };

    this.agents.set(agent.id, agent);

    // Set up message handler for the agent
    this.messageHandlers.set(agent.id, async (message: AgentMessage) => {
      await this.handleAgentMessage(agent, message);
    });

    return agent;
  }

  async assignTask(agentId: string, task: Partial<AgentTask>): Promise<AgentTask> {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error('Agent not found');

    const fullTask: AgentTask = {
      id: crypto.randomUUID(),
      description: task.description || '',
      priority: task.priority || 1,
      dependencies: task.dependencies || [],
      agentId: agentId,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      assignedTo: agentId,
    };

    await taskQueue.add(fullTask.id, fullTask);
    return fullTask;
  }

  private async executeTask(agent: Agent, task: AgentTask): Promise<unknown> {
    // Check memory for similar tasks
    const relevantMemories = await this.searchMemory(
      agent.id,
      task.description,
    );

    // Include relevant memories in the context
    const context = {
      role: agent.role,
      task: task.description,
      relevantMemories,
    };

    switch (agent.role) {
      case 'assistant':
        return this.executeAssistantTask(agent, task, context);
      case 'researcher':
        return this.executeResearchTask(agent, task, context);
      case 'coder':
        return this.executeCodeTask(agent, task, context);
      default:
        throw new Error(`Unsupported agent role: ${agent.role}`);
    }
  }

  private async executeAssistantTask(agent: Agent, task: AgentTask, context: any) {
    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: JSON.stringify({
          task: task.description,
          context,
        }),
      }],
    });
    return response.content;
  }

  private async executeResearchTask(agent: Agent, task: AgentTask, context: any) {
    // Implement research logic using embeddings and vector search
    const embeddings = await this.getEmbeddings(task.description);
    const results = await this.searchVectorDB(embeddings);
    return results;
  }

  private async executeCodeTask(agent: Agent, task: AgentTask, context: any) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{
        role: 'system',
        content: 'You are an expert programmer. Generate high-quality, secure, and efficient code.',
      }, {
        role: 'user',
        content: JSON.stringify({
          task: task.description,
          context,
        }),
      }],
    });
    return response.choices[0].message.content;
  }

  private async getEmbeddings(text: string) {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  }

  private async searchVectorDB(vector: number[]) {
    const index = this.pinecone.index('agent-memory');
    const results = await index.query({
      vector,
      topK: 5,
      includeMetadata: true,
    });
    return results.matches;
  }

  async storeMemory(agentId: string, memory: { type: string; content: any }) {
    const embedding = await this.getEmbeddings(JSON.stringify(memory.content));
    const index = this.pinecone.index('agent-memory');
    const vectorId = `${agentId}-${Date.now()}`;

    await index.upsert({
      vectors: [{
        id: vectorId,
        values: embedding,
        metadata: memory,
      }]
    });

    return vectorId;
  }

  async searchMemory(agentId: string, query: string) {
    const embedding = await this.getEmbeddings(query);
    const index = this.pinecone.index('agent-memory');
    const results = await index.query({
      vector: embedding,
      topK: 5,
      includeMetadata: true,
    });
    return results.matches;
  }

  async updateAgentMemory(agentId: string, event: { action: string; context: Record<string, unknown> }) {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error('Agent not found');

    // Update episodic memory
    agent.memory.episodic.push({
      timestamp: new Date(),
      action: event.action,
      context: event.context,
    });

    // Maintain memory size
    if (agent.memory.episodic.length > 1000) {
      agent.memory.episodic = agent.memory.episodic.slice(-1000);
    }

    // Store in vector DB for long-term memory
    await this.storeMemory(agentId, {
      type: 'episodic',
      content: event,
    });
  }

  async sendMessage(message: AgentMessage) {
    await messageQueue.add(message.id, message);
  }

  private async handleAgentMessage(agent: Agent, message: AgentMessage) {
    // Store message in memory
    await this.updateAgentMemory(agent.id, {
      action: 'message_received',
      context: {
        messageId: message.id,
        content: message.content,
        type: message.type,
      },
    });

    // Process message based on type
    switch (message.type) {
      case 'text':
        await this.processTextMessage(agent, message);
        break;
      case 'code':
        await this.processCodeMessage(agent, message);
        break;
      case 'error':
        await this.processErrorMessage(agent, message);
        break;
      case 'result':
        await this.processResultMessage(agent, message);
        break;
    }
  }

  private async processTextMessage(agent: Agent, message: AgentMessage) {
    // Handle text messages (e.g., questions, instructions)
    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: message.content,
      }],
    });

    await this.sendMessage({
      id: crypto.randomUUID(),
      agentId: message.agentId,
      content: response.content[0].text,
      role: 'assistant',
      type: 'text',
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  private async processCodeMessage(agent: Agent, message: AgentMessage) {
    // Handle code-related messages (e.g., code review, suggestions)
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{
        role: 'system',
        content: 'You are an expert code reviewer.',
      }, {
        role: 'user',
        content: message.content,
      }],
    });

    await this.sendMessage({
      id: crypto.randomUUID(),
      agentId: message.agentId,
      content: response.choices[0].message.content!,
      role: 'assistant',
      type: 'code',
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  private async processErrorMessage(agent: Agent, message: AgentMessage) {
    // Handle error messages (e.g., debugging assistance)
    await this.updateAgentMemory(agent.id, {
      action: 'error_received',
      context: {
        error: message.content,
        metadata: message.metadata,
      },
    });
  }

  private async processResultMessage(agent: Agent, message: AgentMessage) {
    // Handle task results
    await this.updateAgentMemory(agent.id, {
      action: 'result_received',
      context: {
        result: message.content,
        metadata: message.metadata,
      },
    });
  }


} 