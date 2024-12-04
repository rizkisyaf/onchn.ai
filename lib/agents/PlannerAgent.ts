import { OpenAI } from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { AgentCapability, AgentTask } from '@/types/agent';
import { MonitoringService } from '../services/monitoring';
import { PineconeClient } from '@pinecone-database/pinecone';

const openai = new OpenAI(process.env.OPENAI_API_KEY!);
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});
const monitoring = new MonitoringService();

export class PlannerAgent {
  private pinecone: PineconeClient;

  constructor() {
    this.pinecone = new PineconeClient();
    this.initialize();
  }

  private async initialize() {
    await this.pinecone.init({
      environment: process.env.PINECONE_ENV!,
      apiKey: process.env.PINECONE_API_KEY!,
    });
  }

  public getCapabilities(): AgentCapability[] {
    return [
      {
        name: 'create_plan',
        description: 'Create a detailed execution plan for a complex task',
        parameters: {
          objective: 'string',
          constraints: 'Record<string, unknown>',
          availableAgents: 'string[]',
        },
        handler: this.createPlan.bind(this),
      },
      {
        name: 'optimize_plan',
        description: 'Optimize an existing plan for better efficiency',
        parameters: {
          plan: 'Record<string, unknown>',
          metrics: 'string[]',
        },
        handler: this.optimizePlan.bind(this),
      },
      {
        name: 'monitor_execution',
        description: 'Monitor and adjust plan execution in real-time',
        parameters: {
          planId: 'string',
          metrics: 'string[]',
        },
        handler: this.monitorExecution.bind(this),
      },
      {
        name: 'handle_failure',
        description: 'Handle task failures and create recovery plans',
        parameters: {
          failure: 'Record<string, unknown>',
          context: 'Record<string, unknown>',
        },
        handler: this.handleFailure.bind(this),
      },
    ];
  }

  private async createPlan(params: Record<string, unknown>): Promise<unknown> {
    const { objective, constraints, availableAgents } = params;
    const startTime = Date.now();

    try {
      // Analyze objective and break down into subtasks
      const analysisResponse = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{
          role: 'system',
          content: 'Break down this objective into a detailed task hierarchy.',
        }, {
          role: 'user',
          content: JSON.stringify({
            objective,
            constraints,
            availableAgents,
          }),
        }],
      });

      const taskHierarchy = JSON.parse(analysisResponse.choices[0].message.content!);

      // Assign agents to tasks based on capabilities
      const assignmentResponse = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: JSON.stringify({
            taskHierarchy,
            availableAgents,
            constraints,
          }),
        }],
      });

      const assignments = JSON.parse(assignmentResponse.content[0].text);

      // Create execution schedule
      const scheduleResponse = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{
          role: 'system',
          content: 'Create an optimized execution schedule for these tasks.',
        }, {
          role: 'user',
          content: JSON.stringify({
            taskHierarchy,
            assignments,
            constraints,
          }),
        }],
      });

      const schedule = JSON.parse(scheduleResponse.choices[0].message.content!);

      // Generate success criteria
      const criteriaResponse = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: JSON.stringify({
            objective,
            taskHierarchy,
            constraints,
          }),
        }],
      });

      const successCriteria = JSON.parse(criteriaResponse.content[0].text);

      const duration = (Date.now() - startTime) / 1000;
      monitoring.trackTask({
        id: 'create-plan-task',
        description: `Create plan for: ${objective}`,
        status: 'completed',
        assignedTo: 'planner',
        priority: 1,
        dependencies: [],
        agentId: 'planner',
        createdAt: new Date(startTime),
        updatedAt: new Date(Date.now()),
      }, duration);

      return {
        objective,
        tasks: taskHierarchy,
        assignments,
        schedule,
        successCriteria,
        metadata: {
          duration,
          totalTasks: this.countTasks(taskHierarchy),
          agentsInvolved: assignments.length,
        },
      };
    } catch (error) {
      monitoring.logError(error as Error, {
        context: 'planner-agent',
        operation: 'create-plan',
        params,
      });
      throw error;
    }
  }

  private async optimizePlan(params: Record<string, unknown>): Promise<unknown> {
    const { plan, metrics = [] } = params;
    const startTime = Date.now();

    try {
      // Type assertion for metrics
      const metricsArray = Array.isArray(metrics) ? metrics : [];

      // Analyze current plan efficiency
      const analysisResponse = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{
          role: 'system',
          content: `Analyze this plan's efficiency focusing on: ${metricsArray.join(', ')}`,
        }, {
          role: 'user',
          content: JSON.stringify(plan),
        }],
      });

      const analysis = JSON.parse(analysisResponse.choices[0].message.content!);

      // Generate optimization suggestions
      const optimizationResponse = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: JSON.stringify({
            plan,
            analysis,
            metrics,
          }),
        }],
      });

      const optimizations = JSON.parse(optimizationResponse.content[0].text);

      // Apply optimizations
      const updatedPlan = this.applyOptimizations(plan as Record<string, unknown>, optimizations);

      // Verify improvements
      const verificationResponse = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{
          role: 'system',
          content: 'Verify the improvements in the optimized plan.',
        }, {
          role: 'user',
          content: JSON.stringify({
            originalPlan: plan,
            optimizedPlan: updatedPlan,
            metrics,
          }),
        }],
      });

      const verification = JSON.parse(verificationResponse.choices[0].message.content!);

      const duration = (Date.now() - startTime) / 1000;
      monitoring.trackTask({
        id: 'optimize-plan-task',
        description: 'Optimize execution plan',
        status: 'completed',
        assignedTo: 'planner',
        priority: 1,
        dependencies: [],
        agentId: 'planner',
        createdAt: new Date(startTime),
        updatedAt: new Date(Date.now()),
      }, duration);

      return {
        originalPlan: plan,
        optimizedPlan: updatedPlan,
        analysis,
        improvements: verification,
        metadata: {
          duration,
          metricsOptimized: metrics,
          optimizationsApplied: optimizations.length,
        },
      };
    } catch (error) {
      monitoring.logError(error as Error, {
        context: 'planner-agent',
        operation: 'optimize-plan',
        params,
      });
      throw error;
    }
  }

  private async monitorExecution(params: Record<string, unknown>): Promise<unknown> {
    const { planId, metrics = [] } = params;
    const startTime = Date.now();

    try {
      // Get execution status
      const status = await this.getExecutionStatus(planId as string);

      // Analyze progress
      const analysisResponse = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{
          role: 'system',
          content: 'Analyze execution progress and identify potential issues.',
        }, {
          role: 'user',
          content: JSON.stringify({
            status,
            metrics,
          }),
        }],
      });

      const analysis = JSON.parse(analysisResponse.choices[0].message.content!);

      // Generate adjustments if needed
      const adjustments = analysis.issues.length > 0
        ? await this.generateAdjustments(analysis)
        : [];

      const duration = (Date.now() - startTime) / 1000;
      monitoring.trackTask({
        id: 'monitor-execution-task',
        description: `Monitor plan execution: ${planId}`,
        status: 'completed',
        assignedTo: 'planner',
        priority: 1,
        dependencies: [],
        agentId: 'planner',
        createdAt: new Date(startTime),
        updatedAt: new Date(Date.now()),
      }, duration);

      return {
        status,
        analysis,
        adjustments,
        metadata: {
          duration,
          metricsMonitored: metrics,
          issuesIdentified: analysis.issues.length,
        },
      };
    } catch (error) {
      monitoring.logError(error as Error, {
        context: 'planner-agent',
        operation: 'monitor-execution',
        params,
      });
      throw error;
    }
  }

  private async handleFailure(params: Record<string, unknown>): Promise<unknown> {
    const { failure, context } = params;
    const startTime = Date.now();

    try {
      // Analyze failure
      const analysisResponse = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{
          role: 'system',
          content: 'Analyze this failure and identify root causes.',
        }, {
          role: 'user',
          content: JSON.stringify({
            failure,
            context,
          }),
        }],
      });

      const analysis = JSON.parse(analysisResponse.choices[0].message.content!);

      // Generate recovery plan
      const recoveryResponse = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: JSON.stringify({
            failure,
            analysis,
            context,
          }),
        }],
      });

      const recoveryPlan = JSON.parse(recoveryResponse.content[0].text);

      // Validate recovery plan
      const validationResponse = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{
          role: 'system',
          content: 'Validate this recovery plan and assess its likelihood of success.',
        }, {
          role: 'user',
          content: JSON.stringify(recoveryPlan),
        }],
      });

      const validation = JSON.parse(validationResponse.choices[0].message.content!);

      const duration = (Date.now() - startTime) / 1000;
      monitoring.trackTask({
        id: 'handle-failure-task',
        description: 'Handle execution failure',
        status: 'completed',
        assignedTo: 'planner',
        priority: 1,
        dependencies: [],
        agentId: 'planner',
        createdAt: new Date(startTime),
        updatedAt: new Date(Date.now()),
      }, duration);

      return {
        failure,
        analysis,
        recoveryPlan,
        validation,
        metadata: {
          duration,
          rootCauses: analysis.rootCauses.length,
          recoverySteps: recoveryPlan.steps.length,
        },
      };
    } catch (error) {
      monitoring.logError(error as Error, {
        context: 'planner-agent',
        operation: 'handle-failure',
        params,
      });
      throw error;
    }
  }

  private countTasks(taskHierarchy: any): number {
    let count = 1;
    if (Array.isArray(taskHierarchy.subtasks)) {
      count += taskHierarchy.subtasks.reduce(
        (sum: number, task: any) => sum + this.countTasks(task),
        0
      );
    }
    return count;
  }

  private applyOptimizations(plan: Record<string, unknown>, optimizations: any[]): Record<string, unknown> {
    // Implement optimization application logic
    // This is a placeholder implementation
    return {
      ...plan,
      optimizations,
      optimized: true,
    };
  }

  private async getExecutionStatus(planId: string): Promise<Record<string, unknown>> {
    // Implement status retrieval logic
    // This is a placeholder implementation
    return {
      planId,
      progress: 0.5,
      activeSteps: [],
      completedSteps: [],
      issues: [],
    };
  }

  private async generateAdjustments(analysis: any): Promise<unknown[]> {
    // Implement adjustment generation logic
    // This is a placeholder implementation
    return analysis.issues.map((issue: any) => ({
      issue,
      adjustment: 'Placeholder adjustment',
    }));
  }
} 