import { MonitoringService } from '@/lib/services/monitoring';
import { Agent, AgentTask } from '@/types/agent';
import { Redis } from 'ioredis-mock';

// Mock external services
jest.mock('ioredis', () => require('ioredis-mock'));

describe('MonitoringService', () => {
  let monitoring: MonitoringService;

  beforeEach(() => {
    monitoring = new MonitoringService();
  });

  describe('agent tracking', () => {
    const mockAgent: Agent = {
      id: 'test-agent',
      name: 'Test Agent',
      role: 'assistant',
      status: 'idle',
      capabilities: [],
      memory: {
        shortTerm: {},
        longTerm: {},
        episodic: [],
      },
    };

    it('should track agent status', async () => {
      await monitoring.trackAgent(mockAgent);

      const metrics = await monitoring.getAgentMetrics(mockAgent.id);
      expect(metrics).toBeDefined();
      expect(metrics.status).toBe('idle');
      expect(metrics.lastSeen).toBeDefined();
    });

    it('should track agent with current task', async () => {
      const agentWithTask = {
        ...mockAgent,
        status: 'working',
        currentTask: {
          id: 'test-task',
          description: 'Test task',
          startTime: Date.now(),
          progress: 50,
        },
      };

      await monitoring.trackAgent(agentWithTask);

      const metrics = await monitoring.getAgentMetrics(agentWithTask.id);
      expect(metrics.status).toBe('working');
    });
  });

  describe('task tracking', () => {
    const mockTask: AgentTask = {
      id: 'test-task',
      description: 'Test task',
      priority: 1,
      dependencies: [],
      assignedTo: 'test-agent',
      status: 'pending',
      created: Date.now(),
      updated: Date.now(),
    };

    it('should track task status', async () => {
      await monitoring.trackTask(mockTask);

      const metrics = await monitoring.getMetrics();
      expect(metrics).toContain('task_count');
    });

    it('should track task duration', async () => {
      const duration = 5.5; // seconds
      await monitoring.trackTask(mockTask, duration);

      const metrics = await monitoring.getMetrics();
      expect(metrics).toContain('task_duration_seconds');
    });
  });

  describe('memory tracking', () => {
    it('should track memory usage', async () => {
      const agentId = 'test-agent';
      const memoryType = 'shortTerm';
      const size = 1024; // bytes

      await monitoring.trackMemory(agentId, memoryType, size);

      const metrics = await monitoring.getMetrics();
      expect(metrics).toContain('memory_usage_bytes');
    });
  });

  describe('API tracking', () => {
    it('should track API calls', async () => {
      const endpoint = '/api/test';
      const method = 'GET';
      const duration = 0.5; // seconds

      await monitoring.trackApiCall(endpoint, method, duration);

      const metrics = await monitoring.getMetrics();
      expect(metrics).toContain('api_latency_seconds');
    });
  });

  describe('system health', () => {
    it('should return system health metrics', async () => {
      const health = await monitoring.getSystemHealth();

      expect(health).toMatchObject({
        status: 'healthy',
        system: {
          memory: expect.any(Object),
          uptime: expect.any(Number),
        },
      });
    });
  });

  describe('logging', () => {
    it('should log errors', () => {
      const error = new Error('Test error');
      const context = { test: true };

      const logSpy = jest.spyOn(monitoring['logger'], 'error');
      monitoring.logError(error, context);

      expect(logSpy).toHaveBeenCalledWith(error.message, {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        ...context,
      });
    });

    it('should log warnings', () => {
      const message = 'Test warning';
      const context = { test: true };

      const logSpy = jest.spyOn(monitoring['logger'], 'warn');
      monitoring.logWarning(message, context);

      expect(logSpy).toHaveBeenCalledWith(message, context);
    });

    it('should log info', () => {
      const message = 'Test info';
      const context = { test: true };

      const logSpy = jest.spyOn(monitoring['logger'], 'info');
      monitoring.logInfo(message, context);

      expect(logSpy).toHaveBeenCalledWith(message, context);
    });

    it('should log debug', () => {
      const message = 'Test debug';
      const context = { test: true };

      const logSpy = jest.spyOn(monitoring['logger'], 'debug');
      monitoring.logDebug(message, context);

      expect(logSpy).toHaveBeenCalledWith(message, context);
    });
  });
}); 