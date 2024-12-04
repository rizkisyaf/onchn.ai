import type { Prisma } from '@prisma/client';

export interface AgentCapability {
  name: string;
  description: string;
  parameters: Record<string, string>;
  handler: AgentHandler;
}

export type AgentHandler = (params: AgentParams) => Promise<void>;

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
  agentId: string;
  dependencies?: string[];
}

export interface AgentTask {
  id: string;
  description: string;
  status: string;
  priority: number;
  agentId: string;
  assignedTo: string;
  dependencies: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentMessage {
  id: string;
  content: string;
  role: string;
  type?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
  agentId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentMemory {
  id: string;
  type: string;
  content: Prisma.JsonValue;
  metadata: Prisma.JsonValue;
  timestamp: bigint;
  agentId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentError {
  id: string;
  code: string;
  message: string;
  context: Prisma.JsonValue;
  severity: string;
  timestamp: bigint;
  agentId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentMetrics {
  id: string;
  agentId: string;
  taskCount: number;
  successRate: number;
  avgTaskDuration: number;
  memoryUsage: number;
  lastActive: bigint;
  createdAt: Date;
  updatedAt: Date;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: string;
  capabilities: Prisma.JsonValue;
  tasks: AgentTask[];
  memory: {
    shortTerm: Record<string, unknown>;
    longTerm: Record<string, unknown>;
    episodic: Array<Record<string, unknown>>;
  };
  currentTask?: {
    id: string;
    description: string;
    startTime: number;
    progress: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentWorkflow {
  id: string;
  steps: {
    description: string;
    priority: number;
    dependencies: string[];
    assignedTo: string;
  }[];
  metadata: Record<string, unknown>;
}