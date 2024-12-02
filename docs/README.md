# Solana Forensics Documentation

## Overview
Solana Forensics is a comprehensive AI-powered system for analyzing and monitoring Solana blockchain data. The system uses specialized AI agents to perform various tasks from data analysis to code review.

## Table of Contents
1. [Architecture](./architecture.md)
2. [Agents](./agents/README.md)
3. [Services](./services/README.md)
4. [API Reference](./api/README.md)
5. [Database Schema](./database/README.md)
6. [Deployment](./deployment.md)
7. [Security](./security.md)
8. [Contributing](./contributing.md)

## Quick Start
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

## Environment Setup
Required environment variables:
```env
# Database
DATABASE_URL="postgresql://..."

# Authentication
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# OpenAI
OPENAI_API_KEY="..."

# Anthropic
ANTHROPIC_API_KEY="..."

# Pinecone
PINECONE_API_KEY="..."
PINECONE_ENV="..."

# Redis
REDIS_URL="..."

# Rate Limiting
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."

# Monitoring
SENTRY_DSN="..."
```

## System Requirements
- Node.js >= 18.0.0
- PostgreSQL >= 14
- Redis >= 6.2
- At least 4GB RAM for development
- At least 8GB RAM for production

## Core Features
1. **AI Agents**
   - Analyst Agent: Data analysis and insights
   - Orchestrator Agent: Workflow management
   - Researcher Agent: Topic research
   - Coder Agent: Code analysis
   - Planner Agent: Task planning
   - Reviewer Agent: Work review

2. **Services**
   - Agent Service: Agent management and communication
   - Monitoring Service: System monitoring and logging
   - Memory Service: Agent memory management
   - Rate Limiting: Request throttling

3. **API Endpoints**
   - Agent Management
   - Task Management
   - Memory Management
   - Monitoring
   - Health Checks

4. **Security Features**
   - Rate Limiting
   - Authentication
   - Input Validation
   - Error Handling
   - Audit Logging

## License
MIT License - see [LICENSE](../LICENSE) for details 