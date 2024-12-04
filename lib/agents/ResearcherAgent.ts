import { OpenAI } from 'openai';
import { PineconeClient } from '@pinecone-database/pinecone';
import { AgentCapability, AgentHandler } from '../types/agent';
import { MonitoringService } from '../services/monitoring';

const openai = new OpenAI(process.env.OPENAI_API_KEY!);
const monitoring = new MonitoringService();

export class ResearcherAgent {
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
        name: 'research_topic',
        description: 'Research a topic using available knowledge bases',
        parameters: {
          topic: 'string',
          depth: 'number',
          sources: 'string[]',
        },
        handler: this.researchTopic.bind(this) as unknown as AgentHandler,
      },
      {
        name: 'analyze_data',
        description: 'Analyze data and extract insights',
        parameters: {
          data: 'any',
          analysisType: 'string',
        },
        handler: this.analyzeData.bind(this) as unknown as AgentHandler,
      },
      {
        name: 'verify_information',
        description: 'Verify information against trusted sources',
        parameters: {
          information: 'string',
          sources: 'string[]',
        },
        handler: this.verifyInformation.bind(this) as unknown as AgentHandler,
      },
    ];
  }

  private async researchTopic(params: Record<string, unknown>): Promise<unknown> {
    const { topic, depth = 3, sources = [] } = params;
    const startTime = Date.now();

    try {
      // Generate research questions
      const questionsResponse = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{
          role: 'system',
          content: 'You are a research expert. Generate key questions to investigate this topic thoroughly.',
        }, {
          role: 'user',
          content: `Topic: ${topic}\nDepth level: ${depth}`,
        }],
      });

      const questions = questionsResponse.choices[0].message.content!.split('\n');

      // Research each question
      const researchPromises = questions.map(async (question) => {
        // Search vector DB for relevant information
        const embedding = await this.getEmbedding(question);
        const searchResults = await this.searchVectorDB(embedding);

        // Analyze search results
        const analysisResponse = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [{
            role: 'system',
            content: 'Analyze these search results and provide insights.',
          }, {
            role: 'user',
            content: JSON.stringify({
              question,
              results: searchResults,
            }),
          }],
        });

        return {
          question,
          analysis: analysisResponse.choices[0].message.content,
          sources: searchResults.map((r: any) => r.metadata.source),
        };
      });

      const researchResults = await Promise.all(researchPromises);

      // Synthesize findings
      const synthesisResponse = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{
          role: 'system',
          content: 'Synthesize the research findings into a comprehensive report.',
        }, {
          role: 'user',
          content: JSON.stringify(researchResults),
        }],
      });

      const duration = (Date.now() - startTime) / 1000;
      monitoring.trackTask({
        id: 'research-task',
        description: `Research topic: ${topic}`,
        status: 'completed',
        assignedTo: 'researcher',
        priority: 1,
        dependencies: [],
        agentId: 'researcher',
        createdAt: new Date(startTime),
        updatedAt: new Date(Date.now()),
      }, duration);

      return {
        topic,
        findings: synthesisResponse.choices[0].message.content,
        details: researchResults,
        metadata: {
          duration,
          questionsInvestigated: questions.length,
          sourcesConsulted: sources,
        },
      };
    } catch (error) {
      monitoring.logError(error as Error, {
        context: 'researcher-agent',
        operation: 'research-topic',
        params,
      });
      throw error;
    }
  }

  private async analyzeData(params: Record<string, unknown>): Promise<unknown> {
    const { data, analysisType } = params;
    const startTime = Date.now();

    try {
      // Convert data to embeddings for similarity analysis
      const dataStr = JSON.stringify(data);
      const embedding = await this.getEmbedding(dataStr);

      // Find similar analyses
      const similarAnalyses = await this.searchVectorDB(embedding);

      // Analyze data
      const analysisResponse = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{
          role: 'system',
          content: `You are a data analysis expert. Analyze this data using ${analysisType} analysis.`,
        }, {
          role: 'user',
          content: JSON.stringify({
            data,
            similarAnalyses,
          }),
        }],
      });

      const duration = (Date.now() - startTime) / 1000;
      monitoring.trackTask({
        id: 'analysis-task',
        description: `Analyze data using ${analysisType}`,
        status: 'completed',
        assignedTo: 'researcher',
        priority: 1,
        dependencies: [],
        agentId: 'researcher',
        createdAt: new Date(startTime),
        updatedAt: new Date(Date.now()),
      }, duration);

      return {
        analysis: analysisResponse.choices[0].message.content,
        metadata: {
          duration,
          analysisType,
          dataSize: dataStr.length,
          similarAnalysesFound: similarAnalyses.length,
        },
      };
    } catch (error) {
      monitoring.logError(error as Error, {
        context: 'researcher-agent',
        operation: 'analyze-data',
        params,
      });
      throw error;
    }
  }

  private async verifyInformation(params: Record<string, unknown>): Promise<unknown> {
    const { information, sources = [] } = params;
    const startTime = Date.now();

    try {
      // Search for relevant facts in vector DB
      const embedding = await this.getEmbedding(information as string);
      const facts = await this.searchVectorDB(embedding);

      // Verify against each source
      const sourcesArray = Array.isArray(sources) ? sources : [];
      const verificationPromises = sourcesArray.map(async (source: string) => {
        const sourceResponse = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [{
            role: 'system',
            content: 'Verify this information against the provided source. Return a confidence score and explanation.',
          }, {
            role: 'user',
            content: JSON.stringify({
              information,
              source,
              relevantFacts: facts,
            }),
          }],
        });

        return {
          source,
          verification: JSON.parse(sourceResponse.choices[0].message.content!),
        };
      });

      const verificationResults = await Promise.all(verificationPromises);

      // Aggregate verification results
      const aggregateResponse = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{
          role: 'system',
          content: 'Aggregate these verification results into a final verdict.',
        }, {
          role: 'user',
          content: JSON.stringify(verificationResults),
        }],
      });

      const duration = (Date.now() - startTime) / 1000;
      monitoring.trackTask({
        id: 'verification-task',
        description: `Verify information`,
        status: 'completed',
        assignedTo: 'researcher',
        priority: 1,
        dependencies: [],
        agentId: 'researcher',
        createdAt: new Date(startTime),
        updatedAt: new Date(Date.now()),
      }, duration);

      return {
        verified: aggregateResponse.choices[0].message.content,
        details: verificationResults,
        metadata: {
          duration,
          sourcesChecked: sourcesArray.length,
          factsFound: facts.length,
        },
      };
    } catch (error) {
      monitoring.logError(error as Error, {
        context: 'researcher-agent',
        operation: 'verify-information',
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
    const index = this.pinecone.index('research-data');
    const results = await index.query({
      vector,
      topK: 5,
      includeMetadata: true,
    });
    return results.matches || [];
  }
} 