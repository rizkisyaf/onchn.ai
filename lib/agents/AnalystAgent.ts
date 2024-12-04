import { OpenAI } from 'openai';
import { MonitoringService } from '../services/monitoring';
import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { AgentCapability, AgentCreateInput, AgentHandler, AgentParams } from '../types/agent';
import { Anthropic } from '@anthropic-ai/sdk';

const openai = new OpenAI(process.env.OPENAI_API_KEY!);
const monitoring = new MonitoringService();
const prisma = new PrismaClient();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
interface AnalysisParams extends AgentParams {
  data: Record<string, unknown>;
  analysisType: string;
  objectives?: string[];
}

interface PredictionParams extends AgentParams {
  historicalData: Record<string, unknown>;
  timeframe: string;
  metrics?: string[];
}

interface ReportParams extends AgentParams {
  analysis: Record<string, unknown>;
  format?: string;
  sections?: string[];
}

interface AnomalyParams extends AgentParams {
  data: Record<string, unknown>;
  sensitivity?: number;
  context?: Record<string, unknown>;
}

interface CorrelationParams extends AgentParams {
  datasets: Record<string, unknown>[];
  correlationType?: string;
  threshold?: number;
}

export class AnalystAgent {
  private agent!: {
    id: string;
    name: string;
    role: string;
    status: string;
    capabilities: Prisma.JsonValue;
    tasks: {
      id: string;
      description: string;
      status: string;
      priority: number;
      agentId: string;
      createdAt: Date;
      updatedAt: Date;
    }[];
    createdAt: Date;
    updatedAt: Date;
  };

  constructor() {
    this.initialize();
  }

  private async initialize() {
    const capabilities = this.getCapabilities();
    const agentData: Prisma.AgentCreateInput = {
      name: 'analyst',
      role: 'analyst',
      status: 'idle',
      capabilities: capabilities as unknown as Prisma.InputJsonValue,
      tasks: {
        create: [] // Initialize empty tasks array
      }
    };

    const result = await prisma.$transaction(async (tx) => {
      const agent = await tx.agent.upsert({
        where: { name: 'analyst' },
        update: {
          capabilities: capabilities as unknown as Prisma.InputJsonValue,
        },
        create: agentData,
        include: {
          tasks: true,
        },
      });
      return agent;
    });

    this.agent = {
      ...result,
      tasks: result.tasks || []
    };
  }

  private getCapabilities(): AgentCapability[] {
    const analyzeData = async (params: AnalysisParams): Promise<Record<string, unknown>> => {
      const startTime = Date.now();
      try {
        // Convert data to embeddings for analysis
        const dataStr = JSON.stringify(params.data);
        const embedding = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: dataStr,
        });

        // Generate initial analysis
        const analysisResponse = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [{
            role: 'system',
            content: `Analyze this data focusing on: ${params.objectives?.join(', ')}`,
          }, {
            role: 'user',
            content: JSON.stringify({
              data: params.data,
              analysisType: params.analysisType,
            }),
          }],
        });

        const analysis = JSON.parse(analysisResponse.choices[0].message.content!);

        // Get detailed insights
        const insightsResponse = await anthropic.messages.create({
          model: 'claude-3-opus-20240229',
          max_tokens: 4096,
          messages: [{
            role: 'user',
            content: JSON.stringify({
              analysis,
              objectives: params.objectives,
            }),
          }],
        });

        const insights = JSON.parse(insightsResponse.content[0].text);

        const duration = (Date.now() - startTime) / 1000;
        monitoring.trackTask({
          id: 'analyze-data-task',
          description: `Analyze data using ${params.analysisType}`,
          status: 'completed',
          assignedTo: 'analyst',
          agentId: 'analyst',
          priority: 1,
          dependencies: [],
          createdAt: new Date(startTime),
          updatedAt: new Date(Date.now()),
        }, duration);

        return {
          analysis,
          insights,
          metadata: {
            duration,
            dataSize: dataStr.length,
            objectives: params.objectives,
          },
        };
      } catch (error) {
        monitoring.logError(error as Error, {
          context: 'analyst-agent',
          operation: 'analyze-data',
          params,
        });
        throw error;
      }
    };

    const predictTrends = async (params: PredictionParams): Promise<Record<string, unknown>> => {
      const startTime = Date.now();
      try {
        // Analyze historical data patterns
        const patternResponse = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [{
            role: 'system',
            content: 'Analyze historical data patterns and identify trends.',
          }, {
            role: 'user',
            content: JSON.stringify({
              data: params.historicalData,
              timeframe: params.timeframe,
              metrics: params.metrics,
            }),
          }],
        });

        const patterns = JSON.parse(patternResponse.choices[0].message.content!);

        // Generate predictions
        const predictionResponse = await anthropic.messages.create({
          model: 'claude-3-opus-20240229',
          max_tokens: 4096,
          messages: [{
            role: 'user',
            content: JSON.stringify({
              patterns,
              timeframe: params.timeframe,
              metrics: params.metrics,
            }),
          }],
        });

        const predictions = JSON.parse(predictionResponse.content[0].text);

        const duration = (Date.now() - startTime) / 1000;
        monitoring.trackTask({
          id: 'predict-trends-task',
          description: `Predict trends for ${params.timeframe}`,
          status: 'completed',
          assignedTo: 'analyst',
          agentId: 'analyst',
          priority: 1,
          dependencies: [],
          createdAt: new Date(startTime),
          updatedAt: new Date(Date.now()),
        }, duration);

        return {
          patterns,
          predictions,
          metadata: {
            duration,
            timeframe: params.timeframe,
            metricsAnalyzed: params.metrics?.length || 0,
          },
        };
      } catch (error) {
        monitoring.logError(error as Error, {
          context: 'analyst-agent',
          operation: 'predict-trends',
          params,
        });
        throw error;
      }
    };

    const generateReport = async (params: ReportParams): Promise<Record<string, unknown>> => {
      const startTime = Date.now();
      try {
        // Structure report
        const structureResponse = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [{
            role: 'system',
            content: 'Create a structured report outline.',
          }, {
            role: 'user',
            content: JSON.stringify({
              analysis: params.analysis,
              sections: params.sections,
              format: params.format,
            }),
          }],
        });

        const structure = JSON.parse(structureResponse.choices[0].message.content!);

        // Generate detailed content
        const contentResponse = await anthropic.messages.create({
          model: 'claude-3-opus-20240229',
          max_tokens: 4096,
          messages: [{
            role: 'user',
            content: JSON.stringify({
              structure,
              analysis: params.analysis,
            }),
          }],
        });

        const content = JSON.parse(contentResponse.content[0].text);

        const duration = (Date.now() - startTime) / 1000;
        monitoring.trackTask({
          id: 'generate-report-task',
          description: 'Generate analysis report',
          status: 'completed',
          assignedTo: 'analyst',
          agentId: 'analyst',
          priority: 1,
          dependencies: [],
          createdAt: new Date(startTime),
          updatedAt: new Date(Date.now()),
        }, duration);

        return {
          structure,
          content,
          metadata: {
            duration,
            format: params.format,
            sections: params.sections?.length || 0,
          },
        };
      } catch (error) {
        monitoring.logError(error as Error, {
          context: 'analyst-agent',
          operation: 'generate-report',
          params,
        });
        throw error;
      }
    };

    const detectAnomalies = async (params: AnomalyParams): Promise<Record<string, unknown>> => {
      const startTime = Date.now();
      try {
        // Analyze data distribution
        const distributionResponse = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [{
            role: 'system',
            content: 'Analyze data distribution and identify anomalies.',
          }, {
            role: 'user',
            content: JSON.stringify({
              data: params.data,
              sensitivity: params.sensitivity,
              context: params.context,
            }),
          }],
        });

        const distribution = JSON.parse(distributionResponse.choices[0].message.content!);

        // Detect anomalies
        const anomalyResponse = await anthropic.messages.create({
          model: 'claude-3-opus-20240229',
          max_tokens: 4096,
          messages: [{
            role: 'user',
            content: JSON.stringify({
              distribution,
              sensitivity: params.sensitivity,
            }),
          }],
        });

        const anomalies = JSON.parse(anomalyResponse.content[0].text);

        const duration = (Date.now() - startTime) / 1000;
        monitoring.trackTask({
          id: 'detect-anomalies-task',
          description: 'Detect data anomalies',
          status: 'completed',
          assignedTo: 'analyst',
          agentId: 'analyst',
          priority: 1,
          dependencies: [],
          createdAt: new Date(startTime),
          updatedAt: new Date(Date.now()),
        }, duration);

        return {
          distribution,
          anomalies,
          metadata: {
            duration,
            sensitivity: params.sensitivity,
            anomaliesFound: anomalies.length,
          },
        };
      } catch (error) {
        monitoring.logError(error as Error, {
          context: 'analyst-agent',
          operation: 'detect-anomalies',
          params,
        });
        throw error;
      }
    };

    const findCorrelations = async (params: CorrelationParams): Promise<Record<string, unknown>> => {
      const startTime = Date.now();
      try {
        // Analyze relationships between datasets
        const analysisResponse = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [{
            role: 'system',
            content: 'Analyze relationships and correlations between datasets.',
          }, {
            role: 'user',
            content: JSON.stringify({
              datasets: params.datasets,
              correlationType: params.correlationType,
              threshold: params.threshold,
            }),
          }],
        });

        const analysis = JSON.parse(analysisResponse.choices[0].message.content!);

        // Calculate correlations
        const correlationResponse = await anthropic.messages.create({
          model: 'claude-3-opus-20240229',
          max_tokens: 4096,
          messages: [{
            role: 'user',
            content: JSON.stringify({
              analysis,
              threshold: params.threshold,
            }),
          }],
        });

        const correlations = JSON.parse(correlationResponse.content[0].text);

        const duration = (Date.now() - startTime) / 1000;
        monitoring.trackTask({
          id: 'find-correlations-task',
          description: 'Find correlations between datasets',
          status: 'completed',
          assignedTo: 'analyst',
          agentId: 'analyst',
          priority: 1,
          dependencies: [],
          createdAt: new Date(startTime),
          updatedAt: new Date(Date.now()),
        }, duration);

        return {
          analysis,
          correlations,
          metadata: {
            duration,
            datasetsAnalyzed: params.datasets.length,
            correlationsFound: correlations.length,
          },
        };
      } catch (error) {
        monitoring.logError(error as Error, {
          context: 'analyst-agent',
          operation: 'find-correlations',
          params,
        });
        throw error;
      }
    };

    return [
      {
        name: 'analyze',
        description: 'Analyze data and generate insights',
        parameters: {
          data: 'Record<string, unknown>',
          analysisType: 'string',
          objectives: 'string[]',
        },
        handler: analyzeData as unknown as AgentHandler,
      },
      {
        name: 'predict',
        description: 'Generate predictions based on historical data',
        parameters: {
          historicalData: 'Record<string, unknown>',
          timeframe: 'string',
          metrics: 'string[]',
        },
        handler: predictTrends as unknown as AgentHandler,
      },
      {
        name: 'report',
        description: 'Generate comprehensive reports',
        parameters: {
          analysis: 'Record<string, unknown>',
          format: 'string',
          sections: 'string[]',
        },
        handler: generateReport as unknown as AgentHandler,
      },
      {
        name: 'detectAnomalies',
        description: 'Detect anomalies in data',
        parameters: {
          data: 'Record<string, unknown>',
          sensitivity: 'number',
          context: 'Record<string, unknown>',
        },
        handler: detectAnomalies as unknown as AgentHandler,
      },
      {
        name: 'findCorrelations',
        description: 'Find correlations between datasets',
        parameters: {
          datasets: 'Record<string, unknown>[]',
          correlationType: 'string',
          threshold: 'number',
        },
        handler: findCorrelations as unknown as AgentHandler,
      },
    ];
  }
} 