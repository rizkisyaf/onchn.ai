import { Prisma } from '@prisma/client';

export interface AgentCapability {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler: AgentHandler;
}

export type AgentHandler = (params: AgentParams) => Promise<unknown>;

export interface AgentParams {
  [key: string]: unknown;
}

export interface AgentCreateInput {
  name: string;
  role: string;
  status: string;
  capabilities: Prisma.JsonValue;
}

export interface TaskCreateInput {
  description: string;
  status: string;
  priority: number;
  agent: {
    connect: {
      id: string;
    };
  };
  dependencies?: {
    connect: {
      id: string;
    }[];
  };
}

export interface AgentTask {
  id: string;
  description: string;
  status: string;
  priority: number;
  dependencies: string[];
  agentId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentError {
  code: string;
  message: string;
  context: Record<string, unknown>;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AgentMemory {
  type: string;
  content: unknown;
  metadata: Record<string, unknown>;
  timestamp: number;
}

export interface AgentMetrics {
  taskCount: number;
  successRate: number;
  avgTaskDuration: number;
  memoryUsage: number;
  lastActive: number;
}

export interface AgentWorkflow {
  id: string;
  objective: string;
  status: string;
  tasks: AgentTask[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
} 