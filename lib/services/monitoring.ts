import { Redis } from 'ioredis';
import { Gauge, Counter, Registry } from 'prom-client';
import { Logger } from 'winston';
import { createLogger, format, transports } from 'winston';
import { AgentTask, AgentError } from '@/types/agent';

const redis = new Redis(process.env.REDIS_URL!);
const registry = new Registry();

// Prometheus metrics
const taskDuration = new Gauge({
  name: 'task_duration_seconds',
  help: 'Duration of task execution in seconds',
  labelNames: ['agent_id', 'task_type'],
  registers: [registry],
});

const taskCounter = new Counter({
  name: 'tasks_total',
  help: 'Total number of tasks executed',
  labelNames: ['agent_id', 'status'],
  registers: [registry],
});

const errorCounter = new Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['agent_id', 'error_type'],
  registers: [registry],
});

// Winston logger
const logger: Logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' }),
  ],
});

export class MonitoringService {
  async trackTask(task: AgentTask, duration: number): Promise<void> {
    try {
      // Update Prometheus metrics
      taskDuration.labels(task.agentId, task.description).set(duration);
      taskCounter.labels(task.agentId, task.status).inc();

      // Log to Redis for time-series data
      const timeSeriesKey = `task:${task.agentId}:${Date.now()}`;
      await redis.hmset(timeSeriesKey, {
        ...task,
        duration,
        timestamp: Date.now(),
      });
      await redis.expire(timeSeriesKey, 60 * 60 * 24 * 7); // 7 days retention

      // Log to Winston
      logger.info('Task completed', {
        taskId: task.id,
        agentId: task.agentId,
        description: task.description,
        status: task.status,
        duration,
      });
    } catch (error) {
      logger.error('Error tracking task', {
        error: error instanceof Error ? error.message : String(error),
        task,
      });
    }
  }

  logError(error: Error, context: Record<string, unknown>): void {
    try {
      const agentId = context.context as string;
      const errorType = error.name || 'UnknownError';

      // Update Prometheus metrics
      errorCounter.labels(agentId, errorType).inc();

      // Log to Redis for error tracking
      const errorKey = `error:${agentId}:${Date.now()}`;
      const errorData: AgentError = {
        code: errorType,
        message: error.message,
        context,
        timestamp: Date.now(),
        severity: this.calculateErrorSeverity(error),
      };

      redis.hmset(errorKey, errorData);
      redis.expire(errorKey, 60 * 60 * 24 * 30); // 30 days retention

      // Log to Winston
      logger.error('Agent error', {
        error: error.message,
        stack: error.stack,
        ...context,
      });
    } catch (err) {
      logger.error('Error logging error', {
        originalError: error.message,
        loggingError: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async getMetrics(): Promise<string> {
    return registry.metrics();
  }

  async getTaskStats(agentId: string): Promise<Record<string, number>> {
    const keys = await redis.keys(`task:${agentId}:*`);
    const tasks = await Promise.all(
      keys.map(async (key) => redis.hgetall(key))
    );

    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      avgDuration: tasks.reduce((acc, t) => acc + Number(t.duration), 0) / tasks.length,
    };
  }

  async getErrorStats(agentId: string): Promise<{
    total: number;
    bySeverity: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
  }> {
    const keys = await redis.keys(`error:${agentId}:*`);
    const errors = await Promise.all(
      keys.map(async (key) => redis.hgetall(key))
    );

    return {
      total: errors.length,
      bySeverity: {
        low: errors.filter(e => e.severity === 'low').length,
        medium: errors.filter(e => e.severity === 'medium').length,
        high: errors.filter(e => e.severity === 'high').length,
        critical: errors.filter(e => e.severity === 'critical').length,
      }
    };
  }

  private calculateErrorSeverity(error: Error): AgentError['severity'] {
    if (error instanceof TypeError || error instanceof SyntaxError) {
      return 'high';
    }
    if (error.message.includes('timeout') || error.message.includes('rate limit')) {
      return 'medium';
    }
    if (error.message.includes('not found') || error.message.includes('invalid')) {
      return 'low';
    }
    return 'critical';
  }

  async getSystemHealth() {
    const memory = process.memoryUsage();
    const uptime = process.uptime();

    return {
      status: 'healthy',
      timestamp: new Date(),
      system: {
        memory,
        uptime,
      }
    };
  }

  async trackApiCall(endpoint: string, method: string, duration: number) {
    try {
      const apiLatency = new Gauge({
        name: 'api_latency_seconds',
        help: 'API endpoint latency in seconds',
        labelNames: ['endpoint', 'method'],
        registers: [registry],
      });

      apiLatency.labels(endpoint, method).set(duration);
      
      logger.info('API call tracked', { endpoint, method, duration });
    } catch (error) {
      logger.error('Error tracking API call', { error, endpoint, method });
    }
  }

  logWarning(message: string, context: Record<string, unknown>) {
    logger.warn(message, context);
  }
} 