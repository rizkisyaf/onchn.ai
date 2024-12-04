declare module 'openai' {
  export class OpenAI {
    constructor(apiKey: string);
    chat: {
      completions: {
        create(params: {
          model: string;
          messages: Array<{
            role: string;
            content: string;
          }>;
          max_tokens?: number;
        }): Promise<{
          choices: Array<{
            message: {
              content: string;
            };
          }>;
        }>;
      };
    };
    embeddings: {
      create(params: {
        model: string;
        input: string;
      }): Promise<{
        data: Array<{
          embedding: number[];
        }>;
      }>;
    };
  }
}

declare module '@anthropic-ai/sdk' {
  export class Anthropic {
    constructor(config: { apiKey: string });
    messages: {
      create(params: {
        model: string;
        max_tokens: number;
        messages: Array<{
          role: string;
          content: string;
        }>;
      }): Promise<{
        content: Array<{
          text: string;
        }>;
      }>;
    };
  }
}

declare module '@pinecone-database/pinecone' {
  export class PineconeClient {
    constructor();
    init(config: {
      environment: string;
      apiKey: string;
    }): Promise<void>;
    index(name: string): {
      upsert(params: {
        vectors: Array<{
          id: string;
          values: number[];
          metadata?: Record<string, unknown>;
        }>;
      }): Promise<void>;
      query(params: {
        vector: number[];
        topK: number;
        includeMetadata?: boolean;
      }): Promise<{
        matches: Array<{
          id: string;
          score: number;
          metadata?: Record<string, unknown>;
        }>;
      }>;
    };
  }
} 