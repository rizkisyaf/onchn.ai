# API Documentation

## Overview
The API provides endpoints for managing agents, tasks, workflows, and system monitoring.

## Base URL
```
https://api.solanaforensics.com/v1
```

## Authentication
All API requests require authentication using a Bearer token:
```http
Authorization: Bearer <your_token>
```

## Rate Limiting
- 100 requests per minute per IP
- 1000 requests per hour per user
- Burst limit: 10 requests per second

## Endpoints

### Agents

#### List Agents
```http
GET /agents
```
Query parameters:
- `type`: Filter by agent type
- `status`: Filter by status
- `limit`: Max number of results (default: 10)
- `offset`: Pagination offset (default: 0)

Response:
```json
{
  "agents": [
    {
      "id": "string",
      "type": "analyst|orchestrator|researcher|coder|planner|reviewer",
      "status": "active|inactive|busy",
      "capabilities": ["string"],
      "metadata": {}
    }
  ],
  "total": "number",
  "limit": "number",
  "offset": "number"
}
```

#### Create Agent
```http
POST /agents
```
Request body:
```json
{
  "type": "analyst|orchestrator|researcher|coder|planner|reviewer",
  "capabilities": ["string"],
  "metadata": {}
}
```

#### Get Agent
```http
GET /agents/{agentId}
```

#### Update Agent
```http
PATCH /agents/{agentId}
```
Request body:
```json
{
  "status": "active|inactive|busy",
  "capabilities": ["string"],
  "metadata": {}
}
```

#### Delete Agent
```http
DELETE /agents/{agentId}
```

### Tasks

#### Create Task
```http
POST /agents/{agentId}/tasks
```
Request body:
```json
{
  "type": "string",
  "params": {},
  "priority": "number",
  "deadline": "string (ISO date)",
  "dependencies": ["string (task ids)"]
}
```

#### List Tasks
```http
GET /agents/{agentId}/tasks
```
Query parameters:
- `status`: Filter by status
- `priority`: Filter by priority
- `limit`: Max results
- `offset`: Pagination offset

#### Get Task
```http
GET /agents/{agentId}/tasks/{taskId}
```

#### Update Task
```http
PATCH /agents/{agentId}/tasks/{taskId}
```
Request body:
```json
{
  "status": "pending|running|completed|failed",
  "result": {},
  "error": {}
}
```

### Memory

#### Store Memory
```http
POST /agents/{agentId}/memory
```
Request body:
```json
{
  "type": "experience|knowledge|context",
  "content": {},
  "metadata": {}
}
```

#### Query Memory
```http
GET /agents/{agentId}/memory
```
Query parameters:
- `type`: Memory type
- `query`: Search query
- `limit`: Max results
- `similarity`: Minimum similarity score

### Monitoring

#### Get Metrics
```http
GET /monitoring/metrics
```
Query parameters:
- `from`: Start timestamp
- `to`: End timestamp
- `metrics`: Metrics to include
- `resolution`: Time resolution

Response:
```json
{
  "metrics": {
    "cpu_usage": [{
      "timestamp": "number",
      "value": "number"
    }],
    "memory_usage": [{
      "timestamp": "number",
      "value": "number"
    }]
  },
  "period": {
    "start": "number",
    "end": "number"
  }
}
```

#### Health Check
```http
GET /monitoring/health
```
Response:
```json
{
  "status": "healthy|degraded|unhealthy",
  "components": {
    "database": "up|down",
    "redis": "up|down",
    "agents": "up|down"
  },
  "timestamp": "number"
}
```

## Error Handling

### Error Response Format
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {},
    "timestamp": "number"
  }
}
```

### Common Error Codes
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Too Many Requests
- `500`: Internal Server Error
- `503`: Service Unavailable

## Websocket API

### Connect
```javascript
const ws = new WebSocket('wss://api.solanaforensics.com/v1/ws');
```

### Subscribe to Events
```json
{
  "type": "subscribe",
  "channels": ["agents", "tasks", "system"],
  "filters": {
    "agentId": "string",
    "eventTypes": ["string"]
  }
}
```

### Event Format
```json
{
  "type": "event",
  "channel": "string",
  "data": {},
  "timestamp": "number"
}
```

## SDKs
- [TypeScript/JavaScript](https://github.com/solanaforensics/sdk-js)
- [Python](https://github.com/solanaforensics/sdk-python)
- [Rust](https://github.com/solanaforensics/sdk-rust)

## Examples

### Create and Execute Task
```typescript
// Create agent
const agent = await api.agents.create({
  type: "analyst",
  capabilities: ["analyze_data", "detect_anomalies"]
});

// Create task
const task = await api.tasks.create(agent.id, {
  type: "analyze_data",
  params: {
    data: transactionData,
    analysisType: "pattern_recognition",
    objectives: ["identify_anomalies"]
  },
  priority: 1
});

// Monitor task
const result = await api.tasks.waitForCompletion(task.id);
```

### Query Agent Memory
```typescript
const memories = await api.memory.query(agentId, {
  type: "experience",
  query: "transaction analysis",
  similarity: 0.8,
  limit: 10
});
```

### Monitor System Health
```typescript
const ws = api.monitoring.connectWebSocket();

ws.subscribe({
  channels: ["system"],
  filters: {
    eventTypes: ["health", "alerts"]
  }
});

ws.on("event", (event) => {
  if (event.type === "health_degraded") {
    alertOperations(event.data);
  }
});
``` 