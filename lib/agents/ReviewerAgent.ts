import { OpenAI } from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { AgentCapability, AgentHandler } from '../types/agent';
import { MonitoringService } from '../services/monitoring';
import { PineconeClient } from '@pinecone-database/pinecone';

const openai = new OpenAI(process.env.OPENAI_API_KEY!);
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});
const monitoring = new MonitoringService();

export class ReviewerAgent {
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
        name: 'review_work',
        description: 'Review and evaluate work against specified criteria',
        parameters: {
          work: 'Record<string, unknown>',
          criteria: 'string[]',
          context: 'Record<string, unknown>',
        },
        handler: this.reviewWork.bind(this) as unknown as AgentHandler,
      },
      {
        name: 'provide_feedback',
        description: 'Generate constructive feedback and improvement suggestions',
        parameters: {
          review: 'Record<string, unknown>',
          focusAreas: 'string[]',
        },
        handler: this.provideFeedback.bind(this) as unknown as AgentHandler,
      },
      {
        name: 'validate_changes',
        description: 'Validate changes made based on previous feedback',
        parameters: {
          originalWork: 'Record<string, unknown>',
          updatedWork: 'Record<string, unknown>',
          feedback: 'Record<string, unknown>',
        },
        handler: this.validateChanges.bind(this) as unknown as AgentHandler,
      },
      {
        name: 'assess_quality',
        description: 'Assess overall quality and assign quality scores',
        parameters: {
          work: 'Record<string, unknown>',
          metrics: 'string[]',
        },
        handler: this.assessQuality.bind(this) as unknown as AgentHandler,
      },
    ];
  }

  private async reviewWork(params: Record<string, unknown>): Promise<unknown> {
    const { work, criteria = [], context } = params;
    const criteriaArray = Array.isArray(criteria) ? criteria : [];
    const startTime = Date.now();

    try {
      // Find similar past reviews for reference
      const embedding = await this.getEmbedding(JSON.stringify(work));
      const similarReviews = await this.searchVectorDB(embedding);

      // Analyze work against criteria
      const analysisResponse = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{
          role: 'system',
          content: 'Review this work against the specified criteria.',
        }, {
          role: 'user',
          content: JSON.stringify({
            work,
            criteria,
            context,
            similarReviews,
          }),
        }],
      });

      const analysis = JSON.parse(analysisResponse.choices[0].message.content!);

      // Generate detailed evaluation
      const evaluationResponse = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: JSON.stringify({
            work,
            analysis,
            criteria,
          }),
        }],
      });

      const evaluation = JSON.parse(evaluationResponse.content[0].text);

      // Identify improvement areas
      const improvementResponse = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{
          role: 'system',
          content: 'Identify areas for improvement in this work.',
        }, {
          role: 'user',
          content: JSON.stringify({
            work,
            evaluation,
            criteria,
          }),
        }],
      });

      const improvements = JSON.parse(improvementResponse.choices[0].message.content!);

      const duration = (Date.now() - startTime) / 1000;
      monitoring.trackTask({
        id: 'review-work-task',
        description: 'Review work',
        status: 'completed',
        assignedTo: 'reviewer',
        priority: 1,
        dependencies: [],
        agentId: 'reviewer',
        createdAt: new Date(startTime),
        updatedAt: new Date(Date.now()),
      }, duration);

      return {
        analysis,
        evaluation,
        improvements,
        metadata: {
          duration,
          criteriaEvaluated: criteriaArray.length,
          similarReviewsFound: similarReviews.length,
        },
      };
    } catch (error) {
      monitoring.logError(error as Error, {
        context: 'reviewer-agent',
        operation: 'review-work',
        params,
      });
      throw error;
    }
  }

  private async provideFeedback(params: Record<string, unknown>): Promise<unknown> {
    const { review, focusAreas = [] } = params;
    const startTime = Date.now();

    try {
      // Generate constructive feedback
      const feedbackResponse = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{
          role: 'system',
          content: 'Generate constructive feedback focusing on specific areas.',
        }, {
          role: 'user',
          content: JSON.stringify({
            review,
            focusAreas,
          }),
        }],
      });

      const feedback = JSON.parse(feedbackResponse.choices[0].message.content!);

      // Generate improvement suggestions
      const suggestionsResponse = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: JSON.stringify({
            review,
            feedback,
            focusAreas,
          }),
        }],
      });

      const suggestions = JSON.parse(suggestionsResponse.content[0].text);

      // Prioritize feedback points
      const prioritizationResponse = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{
          role: 'system',
          content: 'Prioritize these feedback points by impact and effort.',
        }, {
          role: 'user',
          content: JSON.stringify({
            feedback,
            suggestions,
          }),
        }],
      });

      const prioritization = JSON.parse(prioritizationResponse.choices[0].message.content!);

      const duration = (Date.now() - startTime) / 1000;
      monitoring.trackTask({
        id: 'provide-feedback-task',
        description: 'Provide feedback',
        status: 'completed',
        assignedTo: 'reviewer',
        priority: 1,
        dependencies: [],
        agentId: 'reviewer',
        createdAt: new Date(startTime),
        updatedAt: new Date(Date.now()),
      }, duration);

      return {
        feedback,
        suggestions,
        prioritization,
        metadata: {
          duration,
          focusAreas,
          feedbackPoints: feedback.points.length,
          suggestionsGenerated: suggestions.length,
        },
      };
    } catch (error) {
      monitoring.logError(error as Error, {
        context: 'reviewer-agent',
        operation: 'provide-feedback',
        params,
      });
      throw error;
    }
  }

  private async validateChanges(params: Record<string, unknown>): Promise<unknown> {
    const { originalWork, updatedWork, feedback } = params;
    const startTime = Date.now();

    try {
      // Compare original and updated work
      const comparisonResponse = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{
          role: 'system',
          content: 'Compare the original and updated work to identify changes.',
        }, {
          role: 'user',
          content: JSON.stringify({
            originalWork,
            updatedWork,
          }),
        }],
      });

      const comparison = JSON.parse(comparisonResponse.choices[0].message.content!);

      // Validate changes against feedback
      const validationResponse = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: JSON.stringify({
            comparison,
            feedback,
          }),
        }],
      });

      const validation = JSON.parse(validationResponse.content[0].text);

      // Identify remaining issues
      const issuesResponse = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{
          role: 'system',
          content: 'Identify any remaining issues or unaddressed feedback points.',
        }, {
          role: 'user',
          content: JSON.stringify({
            validation,
            feedback,
          }),
        }],
      });

      const remainingIssues = JSON.parse(issuesResponse.choices[0].message.content!);

      const duration = (Date.now() - startTime) / 1000;
      monitoring.trackTask({
        id: 'validate-changes-task',
        description: 'Validate changes',
        status: 'completed',
        assignedTo: 'reviewer',
        priority: 1,
        dependencies: [],
        agentId: 'reviewer',
        createdAt: new Date(startTime),
        updatedAt: new Date(Date.now()),
      }, duration);

      return {
        comparison,
        validation,
        remainingIssues,
        metadata: {
          duration,
          changesIdentified: comparison.changes.length,
          feedbackAddressed: validation.addressedPoints.length,
          remainingIssues: remainingIssues.length,
        },
      };
    } catch (error) {
      monitoring.logError(error as Error, {
        context: 'reviewer-agent',
        operation: 'validate-changes',
        params,
      });
      throw error;
    }
  }

  private async assessQuality(params: Record<string, unknown>): Promise<unknown> {
    const { work, metrics = [] } = params;
    const metricsArray = Array.isArray(metrics) ? metrics : [];
    const startTime = Date.now();

    try {
      // Analyze quality metrics
      const metricsResponse = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{
          role: 'system',
          content: 'Analyze work quality based on specified metrics.',
        }, {
          role: 'user',
          content: JSON.stringify({
            work,
            metrics,
          }),
        }],
      });

      const metricsAnalysis = JSON.parse(metricsResponse.choices[0].message.content!);

      // Calculate quality scores
      const scoresResponse = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: JSON.stringify({
            work,
            metricsAnalysis,
            metrics,
          }),
        }],
      });

      const scores = JSON.parse(scoresResponse.content[0].text);

      // Generate quality report
      const reportResponse = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{
          role: 'system',
          content: 'Generate a comprehensive quality assessment report.',
        }, {
          role: 'user',
          content: JSON.stringify({
            metricsAnalysis,
            scores,
          }),
        }],
      });

      const report = JSON.parse(reportResponse.choices[0].message.content!);

      const duration = (Date.now() - startTime) / 1000;
      monitoring.trackTask({
        id: 'assess-quality-task',
        description: 'Assess quality',
        status: 'completed',
        assignedTo: 'reviewer',
        priority: 1,
        dependencies: [],
        agentId: 'reviewer',
        createdAt: new Date(startTime),
        updatedAt: new Date(Date.now()),
      }, duration);

      return {
        metricsAnalysis,
        scores,
        report,
        metadata: {
          duration,
          metricsEvaluated: metricsArray.length,
          overallScore: scores.overall,
        },
      };
    } catch (error) {
      monitoring.logError(error as Error, {
        context: 'reviewer-agent',
        operation: 'assess-quality',
        params,
      });
      throw error;
    }
  }

  private async getEmbedding(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  }

  private async searchVectorDB(vector: number[]) {
    const index = this.pinecone.index('review-data');
    const results = await index.query({
      vector,
      topK: 5,
      includeMetadata: true,
    });
    return results.matches || [];
  }
} 