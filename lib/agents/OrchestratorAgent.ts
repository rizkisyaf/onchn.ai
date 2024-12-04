import { OpenAI } from 'openai';
import { 
  AgentCapability, 
  AgentHandler, 
  AgentParams,
  AgentCreateInput,
  TaskCreateInput,
  AgentTask,
  AgentWorkflow
} from '../types/agent';
import { MonitoringService } from '../services/monitoring';
import { PrismaClient, Prisma } from '@prisma/client';

const openai = new OpenAI(process.env.OPENAI_API_KEY!);
const monitoring = new MonitoringService();
const prisma = new PrismaClient();

interface WorkflowParams extends AgentParams {
  objective: string;
  constraints: Record<string, unknown>;
  availableAgents: string[];
}

interface ExecuteParams extends AgentParams {
  workflow: AgentWorkflow;
  context: Record<string, unknown>;
}

interface MonitorParams extends AgentParams {
  workflowId: string;
  metrics: string[];
}

interface OptimizeParams extends AgentParams {
  workflowId: string;
  metrics: string[];
  constraints: Record<string, unknown>;
}

interface FailureParams extends AgentParams {
  workflowId: string;
  error: Record<string, unknown>;
  context: Record<string, unknown>;
}

export class OrchestratorAgent {
  private agent!: Prisma.AgentGetPayload<{
    include: {
      tasks: true;
    }
  }>;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    const capabilities = this.getCapabilities();
    const agentData: Prisma.AgentCreateInput = {
      name: 'orchestrator',
      role: 'orchestrator',
      status: 'idle',
      capabilities: capabilities as unknown as Prisma.InputJsonValue,
      tasks: {
        create: [] // Initialize with empty tasks array
      }
    };

    this.agent = await prisma.agent.upsert({
      where: { name: 'orchestrator' },
      update: {
        status: 'idle',
        capabilities: capabilities as unknown as Prisma.InputJsonValue,
      },
      create: agentData,
      include: {
        tasks: true,
      },
    });
  }

  public getCapabilities(): AgentCapability[] {
    return [
      {
        name: 'create_workflow',
        description: 'Create and plan agent workflows',
        parameters: {
          objective: 'string',
          constraints: 'Record<string, unknown>',
          availableAgents: 'string[]',
        },
        handler: this.createWorkflow.bind(this) as AgentHandler,
      },
      {
        name: 'execute_workflow',
        description: 'Execute and monitor agent workflows',
        parameters: {
          workflow: 'Record<string, unknown>',
          context: 'Record<string, unknown>',
        },
        handler: this.executeWorkflow.bind(this) as AgentHandler,
      },
      {
        name: 'monitor_progress',
        description: 'Monitor workflow progress and handle issues',
        parameters: {
          workflowId: 'string',
          metrics: 'string[]',
        },
        handler: this.monitorProgress.bind(this) as AgentHandler,
      },
      {
        name: 'optimize_workflow',
        description: 'Optimize workflow based on performance',
        parameters: {
          workflowId: 'string',
          metrics: 'string[]',
          constraints: 'Record<string, unknown>',
        },
        handler: this.optimizeWorkflow.bind(this) as AgentHandler,
      },
      {
        name: 'handle_failure',
        description: 'Handle workflow failures and recovery',
        parameters: {
          workflowId: 'string',
          error: 'Record<string, unknown>',
          context: 'Record<string, unknown>',
        },
        handler: this.handleFailure.bind(this) as AgentHandler,
      },
    ];
  }

  private async createWorkflow(params: WorkflowParams): Promise<unknown> {
    const { objective, constraints, availableAgents = [] } = params;
    const startTime = Date.now();

    try {
      // Generate workflow plan
      const planResponse = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{
          role: 'system',
          content: 'Create a workflow plan to achieve the objective using available agents.',
        }, {
          role: 'user',
          content: JSON.stringify({
            objective,
            constraints,
            availableAgents,
          }),
        }],
      });

      const workflowPlan = JSON.parse(planResponse.choices[0].message.content!);

      // Create tasks in transaction
      const tasks = await prisma.$transaction(async (tx) => {
        return Promise.all(
          workflowPlan.steps.map(async (step: any) => {
            const taskData: Prisma.TaskCreateInput = {
              description: step.description,
              status: 'pending',
              priority: step.priority,
              agent: {
                connect: { id: this.agent.id }
              },
              assignedTo: 'orchestrator',
              dependencies: step.dependencies,
            };
            return tx.task.create({ data: taskData });
          })
        );
      });

      const duration = (Date.now() - startTime) / 1000;
      const taskData: AgentTask = {
        id: `workflow-${Date.now()}`,
        description: `Create workflow for ${objective}`,
        status: 'completed',
        priority: 1,
        dependencies: [],
        agentId: this.agent.id,
        assignedTo: 'orchestrator',
        createdAt: new Date(startTime),
        updatedAt: new Date(),
      };

      monitoring.trackTask(taskData, duration);

      return {
        tasks,
        metadata: {
          duration,
          stepsPlanned: tasks.length,
          agentsInvolved: new Set(tasks.map(t => t.agentId)).size,
        },
      };
    } catch (error) {
      monitoring.logError(error as Error, {
        context: 'orchestrator-agent',
        operation: 'create-workflow',
        params,
      });
      throw error;
    }
  }

  private async executeWorkflow(params: ExecuteParams): Promise<unknown> {
    const { workflow, context } = params;
    const startTime = Date.now();

    try {
      const workflowId = workflow.id;

      // Get tasks in dependency order
      const tasks = await prisma.task.findMany({
        where: { agentId: workflowId },
        orderBy: { priority: 'asc' },
        include: { dependencies: true },
      });

      // Execute tasks
      const results = [];
      for (const task of tasks) {
        // Check dependencies
        const incompleteDependencies = task.dependencies.filter(d => d.status !== 'completed');
        
        if (incompleteDependencies.length > 0) {
          continue;
        }

        // Execute task
        const result = await this.executeTask(task, context);
        results.push(result);

        // Update task status
        await prisma.task.update({
          where: { id: task.id },
          data: {
            status: 'completed',
            metadata: result as Prisma.InputJsonValue,
          },
        });
      }

      const duration = (Date.now() - startTime) / 1000;
      const taskData: AgentTask = {
        id: `execute-${Date.now()}`,
        description: `Execute workflow ${workflowId}`,
        status: 'completed',
        priority: 1,
        dependencies: [],
        agentId: this.agent.id,
        assignedTo: 'orchestrator',
        createdAt: new Date(startTime),
        updatedAt: new Date(),
      };

      monitoring.trackTask(taskData, duration);

      return {
        results,
        metadata: {
          duration,
          tasksCompleted: results.length,
          workflowStatus: 'completed',
        },
      };
    } catch (error) {
      monitoring.logError(error as Error, {
        context: 'orchestrator-agent',
        operation: 'execute-workflow',
        params,
      });
      throw error;
    }
  }

  private async monitorProgress(params: MonitorParams): Promise<unknown> {
    const { workflowId, metrics = [] } = params;
    const startTime = Date.now();

    try {
      // Get workflow status
      const agent = await prisma.agent.findUnique({
        where: { id: workflowId },
        include: { tasks: true },
      });

      if (!agent) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      // Calculate metrics
      const metricsData = await Promise.all(
        metrics.map(async (metric) => {
          const value = await this.calculateMetric(agent, metric);
          return { metric, value };
        })
      );

      // Generate progress report
      const reportResponse = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{
          role: 'system',
          content: 'Generate a progress report based on workflow metrics.',
        }, {
          role: 'user',
          content: JSON.stringify({
            agent,
            metricsData,
          }),
        }],
      });

      const report = JSON.parse(reportResponse.choices[0].message.content!);

      const duration = (Date.now() - startTime) / 1000;
      const taskData: AgentTask = {
        id: `monitor-${Date.now()}`,
        description: `Monitor workflow ${workflowId}`,
        status: 'completed',
        priority: 1,
        dependencies: [],
        agentId: this.agent.id,
        assignedTo: 'orchestrator',
        createdAt: new Date(startTime),
        updatedAt: new Date(),
      };

      monitoring.trackTask(taskData, duration);

      return {
        agent,
        metrics: metricsData,
        report,
        metadata: {
          duration,
          metricsCalculated: metricsData.length,
          workflowStatus: agent.status,
        },
      };
    } catch (error) {
      monitoring.logError(error as Error, {
        context: 'orchestrator-agent',
        operation: 'monitor-progress',
        params,
      });
      throw error;
    }
  }

  private async optimizeWorkflow(params: OptimizeParams): Promise<unknown> {
    const { workflowId, metrics = [], constraints } = params;
    const startTime = Date.now();

    try {
      // Get workflow data
      const agent = await prisma.agent.findUnique({
        where: { id: workflowId },
        include: { tasks: true },
      });

      if (!agent) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      // Analyze performance
      const performanceData = await Promise.all(
        metrics.map(async (metric) => {
          const value = await this.calculateMetric(agent, metric);
          return { metric, value };
        })
      );

      // Generate optimization suggestions
      const optimizationResponse = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{
          role: 'system',
          content: 'Generate optimization suggestions based on workflow performance.',
        }, {
          role: 'user',
          content: JSON.stringify({
            agent,
            performanceData,
            constraints,
          }),
        }],
      });

      const optimizations = JSON.parse(optimizationResponse.choices[0].message.content!);

      // Apply optimizations
      const updatedAgent = await this.applyOptimizations(agent, optimizations);

      const duration = (Date.now() - startTime) / 1000;
      const taskData: AgentTask = {
        id: `optimize-${Date.now()}`,
        description: `Optimize workflow ${workflowId}`,
        status: 'completed',
        priority: 1,
        dependencies: [],
        agentId: this.agent.id,
        assignedTo: 'orchestrator',
        createdAt: new Date(startTime),
        updatedAt: new Date(),
      };

      monitoring.trackTask(taskData, duration);

      return {
        originalAgent: agent,
        optimizations,
        updatedAgent,
        metadata: {
          duration,
          metricsAnalyzed: metrics.length,
          optimizationsApplied: optimizations.length,
        },
      };
    } catch (error) {
      monitoring.logError(error as Error, {
        context: 'orchestrator-agent',
        operation: 'optimize-workflow',
        params,
      });
      throw error;
    }
  }

  private async handleFailure(params: FailureParams): Promise<unknown> {
    const { workflowId, error, context } = params;
    const startTime = Date.now();

    try {
      // Get workflow data
      const agent = await prisma.agent.findUnique({
        where: { id: workflowId },
        include: { tasks: true },
      });

      if (!agent) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      // Analyze failure
      const analysisResponse = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{
          role: 'system',
          content: 'Analyze workflow failure and suggest recovery steps.',
        }, {
          role: 'user',
          content: JSON.stringify({
            agent,
            error,
            context,
          }),
        }],
      });

      const analysis = JSON.parse(analysisResponse.choices[0].message.content!);

      // Create recovery plan
      const recoveryPlan = await this.createRecoveryPlan(agent, analysis);

      // Execute recovery
      const recoveryResult = await this.executeRecovery(agent, recoveryPlan);

      const duration = (Date.now() - startTime) / 1000;
      const taskData: AgentTask = {
        id: `failure-${Date.now()}`,
        description: `Handle failure in workflow ${workflowId}`,
        status: 'completed',
        priority: 1,
        dependencies: [],
        agentId: this.agent.id,
        assignedTo: 'orchestrator',
        createdAt: new Date(startTime),
        updatedAt: new Date(),
      };

      monitoring.trackTask(taskData, duration);

      return {
        agent,
        error,
        analysis,
        recoveryPlan,
        recoveryResult,
        metadata: {
          duration,
          failurePoint: analysis.failurePoint,
          recoverySteps: (recoveryPlan as any).steps?.length ?? 0,
        },
      };
    } catch (error) {
      monitoring.logError(error as Error, {
        context: 'orchestrator-agent',
        operation: 'handle-failure',
        params,
      });
      throw error;
    }
  }

  private async executeTask(task: any, context: unknown): Promise<unknown> {
    // Implement task execution logic
    return {};
  }

  private async calculateMetric(agent: any, metric: string): Promise<number> {
    // Implement metric calculation logic
    return 0;
  }

  private async applyOptimizations(agent: any, optimizations: any[]): Promise<unknown> {
    // Implement optimization application logic
    return agent;
  }

  private async createRecoveryPlan(agent: any, analysis: any): Promise<unknown> {
    // Implement recovery plan creation logic
    return {
      steps: [],
    };
  }

  private async executeRecovery(agent: any, plan: any): Promise<unknown> {
    // Implement recovery execution logic
    return {};
  }
} 