# Luxor9 Ai Factory — Full Stack

A cinematic AI agent orchestration platform with a story-driven UI/UX.

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                      │
│  React + Vite + Tailwind CSS + Framer Motion    │
│  Story-driven landing page with cinematic UI    │
│  Agent workstations, Neural Core, Canvas, Tasks │
├─────────────────────────────────────────────────┤
│                   BACKEND                       │
│  Express.js + SQLite + JWT Auth + WebSocket     │
│  REST API for sessions, tasks, memories, assets │
│  MCP Orchestrator for AI agent delegation       │
│  Gemini AI integration for chat & generation    │
├─────────────────────────────────────────────────┤
│                  SERVICES                       │
│  Google Gemini (AI) │ MCP Protocol │ WebSocket  │
│  File Storage │ Analytics │ Agent Registry      │
└─────────────────────────────────────────────────┘
```

## Quick Start

### Frontend Only (Static)
```bash
npm install
npm run dev
```

### Full Stack (Docker)
```bash
# Set your Gemini API key (optional)
export API_KEY=your-gemini-api-key

# Start everything
docker-compose up -d

# Frontend: http://localhost:3000
# API:       http://localhost:8080
# WebSocket: ws://localhost:8080/ws
```

### Full Stack (Manual)
```bash
# 1. Start the backend
cd service
bash install.sh      # Install backend deps
node server.js       # Start API server on :8080

# 2. Seed demo data (optional)
node seed.js         # Creates demo user: demo / demo123

# 3. Start the frontend
cd ..
npm install
npm run dev          # Frontend on :5173
```

## API Reference

See [API_REFERENCE.md](./API_REFERENCE.md) for complete documentation.

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/sessions` | List chat sessions |
| POST | `/api/ai/chat` | Send message to AI |
| GET | `/api/tasks` | List tasks with subtasks |
| POST | `/api/memories` | Store memory in Neural Core |
| POST | `/api/assets/upload` | Upload files |
| POST | `/api/mcp/execute` | MCP agent orchestration |
| GET | `/health` | Server health check |

## Features

### Story-Driven Landing Page
- Cinematic narrative: "A Boy, A Chair, A World of Code"
- 4-chapter story structure with scroll-reveal animations
- Amber-accented glass morphism design system
- Custom cursor, particle system, film grain overlay

### AI Agent Factory
- **12 Specialized Agents**: Overseer, Developer, Visionary, Director, Researcher, Data Analyst, Communicator, Navigator, HR Manager, Integration Lead, Speedster, Antigravity
- MCP Protocol for tool integration
- Real-time WebSocket updates

### Full Stack Backend
- SQLite database with full schema
- JWT authentication
- RESTful API with 40+ endpoints
- WebSocket for real-time notifications
- File upload with Multer
- MCP Orchestrator for AI delegation

### Frontend Components
- `HeroContent` — Framer-motion choreographed hero with reduced-motion support
- `GlassButton` — Ripple effect + edge-light micro-interactions
- `VideoBackground` — Responsive video with poster + mobile fallback
- `AgentSelector` — Sidebar with agent hierarchy
- `AgentWorkstation` — Chat + Canvas + Tasks + Neural Core
- `NeuralCore` — Vector memory store with graph visualization
- `LiveInterface` — Voice/video AI sessions
- `TaskBoard` — Kanban-style task management

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS 4, Framer Motion |
| Backend | Express.js, SQLite (better-sqlite3), JWT |
| AI | Google Gemini API |
| Real-time | WebSocket (ws) |
| Auth | bcrypt + JWT |
| Files | Multer |
| Container | Docker + Docker Compose |

## Environment Variables

```env
# Backend
PORT=8080
API_KEY=your-gemini-api-key
JWT_SECRET=your-jwt-secret

# Frontend (auto-detected)
# API calls go to http://localhost:8080
```

---

[![Edit with Shakespeare](https://shakespeare.diy/badge.svg)](https://shakespeare.diy/clone?url=https%3A%2F%2Fgithub.com%2FLUXORANOVA9%2Fprototype.git)
