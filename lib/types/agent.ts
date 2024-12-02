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
  dependencies: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentMessage {
  id: string;
  content: string;
  role: string;
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
  createdAt: Date;
  updatedAt: Date;
} 