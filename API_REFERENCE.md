# Luxor9 Ai Factory — Full Stack API Reference

Base URL: `http://localhost:8080`
WebSocket: `ws://localhost:8080/ws`

## Authentication

All `/api/*` routes require a Bearer token in the `Authorization` header.

### Register
```
POST /api/auth/register
Body: { "username": "string", "email": "string", "password": "string", "displayName": "string" }
Response: { "token": "jwt", "user": { "id", "username", "email", "display_name" } }
```

### Login
```
POST /api/auth/login
Body: { "username": "string", "password": "string" }
Response: { "token": "jwt", "user": { ... } }
```

### Get Current User
```
GET /api/auth/me
Response: { "user": { "id", "username", "email", "display_name", "created_at" } }
```

---

## Sessions

### Create Session
```
POST /api/sessions
Body: { "agentType": "OVERSEER", "title": "My Session" }
Response: { "session": { "id", "user_id", "agent_type", "title", "created_at" } }
```

### List Sessions
```
GET /api/sessions
Response: { "sessions": [...] }
```

### Get Session + Messages
```
GET /api/sessions/:id
Response: { "session": { ... }, "messages": [...] }
```

### Update Session
```
PATCH /api/sessions/:id
Body: { "title": "New Title" }
Response: { "session": { ... } }
```

### Delete (Archive) Session
```
DELETE /api/sessions/:id
Response: { "success": true }
```

---

## Messages

### Send Message
```
POST /api/sessions/:sessionId/messages
Body: { "role": "user|model|system", "content": "string", "imageData": "base64", "metadata": {} }
Response: { "messageId": "uuid" }
```

### List Messages
```
GET /api/sessions/:sessionId/messages
Response: { "messages": [...] }
```

---

## Tasks

### Create Task
```
POST /api/tasks
Body: { "title": "string", "description": "string", "status": "pending|active|blocked|completed|failed",
        "priority": "low|medium|high|critical", "assignedAgent": "DEVELOPER",
        "parentTaskId": "uuid", "isParallel": false, "sessionId": "uuid" }
Response: { "task": { ... } }
```

### List Tasks (with subtasks)
```
GET /api/tasks
Response: { "tasks": [{ "id", "title", "status", ..., "subtasks": [...] }] }
```

### Get Task
```
GET /api/tasks/:id
Response: { "task": { ..., "subtasks": [...] } }
```

### Update Task
```
PATCH /api/tasks/:id
Body: { "title": "string", "status": "completed", "priority": "high", ... }
Response: { "task": { ... } }
```

### Delete Task
```
DELETE /api/tasks/:id
Response: { "success": true }
```

---

## Memories (Neural Core)

### Create Memory
```
POST /api/memories
Body: { "content": "string", "type": "user_fact|interaction|system_note",
        "tags": ["tag1"], "relevance": 0.8, "isPinned": true }
Response: { "memory": { ... } }
```

### List Memories
```
GET /api/memories?limit=50
Response: { "memories": [...], "pinned": [...] }
```

### Search Memories
```
GET /api/memories/search?q=query
Response: { "memories": [...] }
```

### Toggle Pin
```
PATCH /api/memories/:id/pin
Response: { "memory": { ... } }
```

### Delete Memory
```
DELETE /api/memories/:id
Response: { "success": true }
```

### Clear Unpinned
```
DELETE /api/memories
Response: { "success": true }
```

---

## Assets (File Upload)

### Upload File
```
POST /api/assets/upload
Content-Type: multipart/form-data
Body: file (binary)
Response: { "asset": { "id", "filename", "mime_type", "size" }, "url": "/uploads/..." }
```

### List Assets
```
GET /api/assets
Response: { "assets": [{ ..., "url": "/uploads/..." }] }
```

### Delete Asset
```
DELETE /api/assets/:id
Response: { "success": true }
```

---

## Canvas Artifacts

### Create Artifact
```
POST /api/canvas
Body: { "title": "string", "type": "html|react|python|markdown|json|mermaid", "content": "string" }
Response: { "artifact": { ... } }
```

### List Artifacts
```
GET /api/canvas
Response: { "artifacts": [...] }
```

### Get Artifact
```
GET /api/canvas/:id
Response: { "artifact": { ... } }
```

### Update Artifact
```
PUT /api/canvas/:id
Body: { "title": "string", "content": "string" }
Response: { "artifact": { ... } }
```

### Delete Artifact
```
DELETE /api/canvas/:id
Response: { "success": true }
```

---

## AI Chat

```
POST /api/ai/chat
Body: { "prompt": "string", "model": "gemini-2.0-flash", "systemInstruction": "string", "sessionId": "uuid" }
Response: { "response": { "text": "string", "model": "string" } }
```

---

## MCP Orchestrator

```
POST /api/mcp/execute
Body: { "prompt": "string", "dryRun": false }
Response: { "requestId": "uuid", "planIntent": "string", "results": [...] }
```

---

## Analytics

### Track Event
```
POST /api/analytics/track
Body: { "eventName": "string", "meta": {} }
Response: { "success": true }
```

### Get Events
```
GET /api/analytics/events?limit=100
Response: { "events": [...] }
```

---

## Agents

```
GET /api/agents
Response: { "agents": [{ "id", "name", "description", "icon", "category" }] }
```

---

## Health

```
GET /health
Response: { "status": "ok", "version": "2.0.0", "services": { ... }, "stats": { ... } }
```

---

## WebSocket Protocol

Connect to `ws://localhost:8080/ws`

### Authenticate
```json
{ "type": "auth", "token": "your-jwt-token" }
```

### Server Messages
```json
{ "type": "auth_ok", "userId": "uuid" }
{ "type": "new_message", "sessionId": "uuid", "messageId": "uuid" }
{ "type": "ai_response", "sessionId": "uuid", "messageId": "uuid" }
{ "type": "task_created", "task": { ... } }
{ "type": "task_updated", "task": { ... } }
{ "type": "task_deleted", "taskId": "uuid" }
```
