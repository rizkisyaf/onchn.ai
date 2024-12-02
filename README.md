# AI Agent Platform

A comprehensive platform for managing and orchestrating AI agents with different roles and capabilities.

## Features

- Multi-agent system with different roles (Assistant, Researcher, Coder, etc.)
- Task management and orchestration
- Memory management with short-term and long-term storage
- Vector database integration for semantic search
- Real-time task progress monitoring
- Modern UI with responsive design

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- Prisma (PostgreSQL)
- Redis for task queue
- Pinecone for vector storage
- OpenAI and Anthropic for LLM integration
- TailwindCSS for styling
- NextAuth.js for authentication

## Prerequisites

- Node.js >= 18
- PostgreSQL
- Redis
- Pinecone account
- OpenAI API key
- Anthropic API key

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai-agent-platform.git
cd ai-agent-platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Fill in the required API keys and configuration

4. Set up the database:
```bash
# Create database
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

5. Run the development server:
```bash
npm run dev
```

## Architecture

### Agent System

The platform uses a multi-agent system where each agent has:
- Specific role and capabilities
- Memory management (short-term, long-term, episodic)
- Task queue for handling requests
- Vector embeddings for semantic search

### Components

- `AgentService`: Core service for managing agents and tasks
- `TaskQueue`: Redis-based queue for handling async tasks
- `VectorStore`: Pinecone integration for semantic search
- `MemoryManager`: Handles different types of agent memory

### API Routes

- `/api/agents`: Agent management
- `/api/agents/[agentId]/tasks`: Task management
- `/api/agents/[agentId]/memory`: Memory management

## Usage

1. Create an agent with a specific role
2. Assign tasks to agents
3. Monitor task progress in real-time
4. View agent memory and task history

## Development

- Run tests: `npm test`
- Type checking: `npm run type-check`
- Linting: `npm run lint`
- Build: `npm run build`

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT 
