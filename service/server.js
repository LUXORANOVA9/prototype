/**
 * Luxor9 Ai Factory — Full Stack Backend Server
 * Complete REST API with SQLite, JWT Auth, WebSocket, File Uploads
 */

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { GoogleGenAI } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import multer from 'multer';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Configuration ---
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'luxor9-factory-secret-' + uuidv4();
const API_KEY = process.env.API_KEY;
const DB_PATH = join(__dirname, 'data', 'luxor9.db');
const UPLOAD_DIR = join(__dirname, 'data', 'uploads');

// Ensure directories exist
mkdirSync(join(__dirname, 'data'), { recursive: true });
mkdirSync(UPLOAD_DIR, { recursive: true });

// --- Database Setup ---
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch()),
    last_login INTEGER,
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_type TEXT NOT NULL DEFAULT 'OVERSEER',
    title TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch()),
    is_archived INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK(role IN ('user', 'model', 'system')),
    content TEXT,
    image_data TEXT,
    video_uri TEXT,
    audio_data TEXT,
    metadata_json TEXT,
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id TEXT REFERENCES sessions(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'active', 'blocked', 'completed', 'failed')),
    priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'critical')),
    assigned_agent TEXT,
    parent_task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
    is_parallel INTEGER DEFAULT 0,
    output TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch()),
    completed_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'user_fact' CHECK(type IN ('user_fact', 'interaction', 'system_note')),
    tags_json TEXT DEFAULT '[]',
    relevance REAL DEFAULT 0.0,
    is_pinned INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    path TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS canvas_artifacts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id TEXT REFERENCES sessions(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    type TEXT DEFAULT 'html' CHECK(type IN ('html', 'react', 'python', 'markdown', 'json', 'mermaid')),
    content TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    event_name TEXT NOT NULL,
    meta_json TEXT,
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
  CREATE INDEX IF NOT EXISTS idx_memories_user ON memories(user_id);
  CREATE INDEX IF NOT EXISTS idx_memories_pinned ON memories(user_id, is_pinned);
  CREATE INDEX IF NOT EXISTS idx_assets_user ON assets(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
`);

// --- Prepared Statements ---
const stmts = {
  // Users
  createUser: db.prepare('INSERT INTO users (id, username, email, password_hash, display_name) VALUES (?, ?, ?, ?, ?)'),
  getUserByUsername: db.prepare('SELECT * FROM users WHERE username = ?'),
  getUserByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
  getUserById: db.prepare('SELECT id, username, email, display_name, avatar_url, created_at FROM users WHERE id = ?'),
  updateLastLogin: db.prepare('UPDATE users SET last_login = unixepoch() WHERE id = ?'),

  // Sessions
  createSession: db.prepare('INSERT INTO sessions (id, user_id, agent_type, title) VALUES (?, ?, ?, ?)'),
  getSessionsByUser: db.prepare('SELECT * FROM sessions WHERE user_id = ? AND is_archived = 0 ORDER BY updated_at DESC'),
  getSessionById: db.prepare('SELECT * FROM sessions WHERE id = ?'),
  updateSessionTitle: db.prepare('UPDATE sessions SET title = ?, updated_at = unixepoch() WHERE id = ?'),
  archiveSession: db.prepare('UPDATE sessions SET is_archived = 1 WHERE id = ?'),

  // Messages
  createMessage: db.prepare('INSERT INTO messages (id, session_id, role, content, image_data, video_uri, audio_data, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'),
  getMessagesBySession: db.prepare('SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC'),
  deleteMessagesBySession: db.prepare('DELETE FROM messages WHERE session_id = ?'),

  // Tasks
  createTask: db.prepare('INSERT INTO tasks (id, user_id, session_id, title, description, status, priority, assigned_agent, parent_task_id, is_parallel) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'),
  getTasksByUser: db.prepare('SELECT * FROM tasks WHERE user_id = ? AND parent_task_id IS NULL ORDER BY created_at DESC'),
  getTaskById: db.prepare('SELECT * FROM tasks WHERE id = ?'),
  getSubtasks: db.prepare('SELECT * FROM tasks WHERE parent_task_id = ? ORDER BY created_at ASC'),
  updateTaskStatus: db.prepare('UPDATE tasks SET status = ?, updated_at = unixepoch(), completed_at = CASE WHEN ? = 'completed' THEN unixepoch() ELSE completed_at END WHERE id = ?'),
  updateTask: db.prepare('UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, assigned_agent = ?, updated_at = unixepoch() WHERE id = ?'),
  deleteTask: db.prepare('DELETE FROM tasks WHERE id = ?'),

  // Memories
  createMemory: db.prepare('INSERT INTO memories (id, user_id, content, type, tags_json, relevance, is_pinned) VALUES (?, ?, ?, ?, ?, ?, ?)'),
  getMemoriesByUser: db.prepare('SELECT * FROM memories WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'),
  getPinnedMemories: db.prepare('SELECT * FROM memories WHERE user_id = ? AND is_pinned = 1 ORDER BY created_at DESC'),
  searchMemories: db.prepare("SELECT * FROM memories WHERE user_id = ? AND content LIKE ? ORDER BY created_at DESC LIMIT ?"),
  updateMemoryPin: db.prepare('UPDATE memories SET is_pinned = ?, updated_at = unixepoch() WHERE id = ?'),
  deleteMemory: db.prepare('DELETE FROM memories WHERE id = ?'),
  clearUnpinnedMemories: db.prepare('DELETE FROM memories WHERE user_id = ? AND is_pinned = 0'),

  // Assets
  createAsset: db.prepare('INSERT INTO assets (id, user_id, filename, original_name, mime_type, size, path) VALUES (?, ?, ?, ?, ?, ?, ?)'),
  getAssetsByUser: db.prepare('SELECT * FROM assets WHERE user_id = ? ORDER BY created_at DESC'),
  getAssetById: db.prepare('SELECT * FROM assets WHERE id = ?'),
  deleteAsset: db.prepare('DELETE FROM assets WHERE id = ?'),

  // Canvas
  createArtifact: db.prepare('INSERT INTO canvas_artifacts (id, user_id, session_id, title, type, content) VALUES (?, ?, ?, ?, ?, ?)'),
  getArtifactsByUser: db.prepare('SELECT * FROM canvas_artifacts WHERE user_id = ? ORDER BY updated_at DESC'),
  getArtifactById: db.prepare('SELECT * FROM canvas_artifacts WHERE id = ?'),
  updateArtifact: db.prepare('UPDATE canvas_artifacts SET title = ?, content = ?, updated_at = unixepoch() WHERE id = ?'),
  deleteArtifact: db.prepare('DELETE FROM canvas_artifacts WHERE id = ?'),

  // Analytics
  trackEvent: db.prepare('INSERT INTO analytics (user_id, event_name, meta_json) VALUES (?, ?, ?)'),
  getEvents: db.prepare('SELECT * FROM analytics WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'),
};

// --- Express Setup ---
const app = express();
const server = createServer(app);

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(morgan(':date[iso] :method :url :status :res[content-length] - :response-time ms'));

// Serve uploaded files
app.use('/uploads', express.static(UPLOAD_DIR));

// File upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop();
    cb(null, `${uuidv4()}.${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB limit

// --- AI Client ---
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// --- Auth Middleware ---
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Missing authorization header' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.ctx = { userId: decoded.userId, requestId: uuidv4() };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

// --- WebSocket Setup ---
const wss = new WebSocketServer({ server, path: '/ws' });
const wsClients = new Map(); // userId -> Set<ws>

wss.on('connection', (ws, req) => {
  let userId = null;

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      if (msg.type === 'auth') {
        try {
          const decoded = jwt.verify(msg.token, JWT_SECRET);
          userId = decoded.userId;
          if (!wsClients.has(userId)) wsClients.set(userId, new Set());
          wsClients.get(userId).add(ws);
          ws.send(JSON.stringify({ type: 'auth_ok', userId }));
        } catch {
          ws.send(JSON.stringify({ type: 'auth_error', error: 'Invalid token' }));
        }
      }
    } catch {}
  });

  ws.on('close', () => {
    if (userId && wsClients.has(userId)) {
      wsClients.get(userId).delete(ws);
      if (wsClients.get(userId).size === 0) wsClients.delete(userId);
    }
  });
});

function broadcastToUser(userId, message) {
  const clients = wsClients.get(userId);
  if (clients) {
    const data = JSON.stringify(message);
    clients.forEach(ws => { if (ws.readyState === 1) ws.send(data); });
  }
}

// ========================
// === API ROUTES ========
// ========================

// --- Health ---
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '2.0.0',
    name: 'Luxor9 Ai Factory',
    uptime: process.uptime(),
    services: {
      database: 'connected',
      ai_provider: ai ? 'connected' : 'not configured',
      websocket: `ws://localhost:${PORT}/ws`
    },
    stats: {
      users: db.prepare('SELECT COUNT(*) as c FROM users').get().c,
      sessions: db.prepare('SELECT COUNT(*) as c FROM sessions').get().c,
      messages: db.prepare('SELECT COUNT(*) as c FROM messages').get().c,
      tasks: db.prepare('SELECT COUNT(*) as c FROM tasks').get().c,
      memories: db.prepare('SELECT COUNT(*) as c FROM memories').get().c,
    }
  });
});

// ========================
// === AUTH ROUTES ========
// ========================

app.post('/api/auth/register', (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email, and password are required' });
    }

    if (stmts.getUserByUsername.get(username)) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    if (stmts.getUserByEmail.get(email)) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const id = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);
    stmts.createUser.run(id, username, email, passwordHash, displayName || username);

    const token = generateToken(id);
    const user = stmts.getUserById.get(id);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }

    const user = stmts.getUserByUsername.get(username);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    stmts.updateLastLogin.run(user.id);
    const token = generateToken(user.id);
    const safeUser = stmts.getUserById.get(user.id);
    res.json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authenticate, (req, res) => {
  const user = stmts.getUserById.get(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// ========================
// === SESSION ROUTES ====
// ========================

app.post('/api/sessions', authenticate, (req, res) => {
  const { agentType, title } = req.body;
  const id = uuidv4();
  stmts.createSession.run(id, req.userId, agentType || 'OVERSEER', title || 'New Session');
  const session = stmts.getSessionById.get(id);
  res.status(201).json({ session });
});

app.get('/api/sessions', authenticate, (req, res) => {
  const sessions = stmts.getSessionsByUser.all(req.userId);
  res.json({ sessions });
});

app.get('/api/sessions/:id', authenticate, (req, res) => {
  const session = stmts.getSessionById.get(req.params.id);
  if (!session || session.user_id !== req.userId) return res.status(404).json({ error: 'Session not found' });
  const messages = stmts.getMessagesBySession.all(req.params.id);
  res.json({ session, messages });
});

app.patch('/api/sessions/:id', authenticate, (req, res) => {
  const session = stmts.getSessionById.get(req.params.id);
  if (!session || session.user_id !== req.userId) return res.status(404).json({ error: 'Session not found' });
  if (req.body.title) stmts.updateSessionTitle.run(req.body.title, req.params.id);
  res.json({ session: stmts.getSessionById.get(req.params.id) });
});

app.delete('/api/sessions/:id', authenticate, (req, res) => {
  const session = stmts.getSessionById.get(req.params.id);
  if (!session || session.user_id !== req.userId) return res.status(404).json({ error: 'Session not found' });
  stmts.archiveSession.run(req.params.id);
  res.json({ success: true });
});

// ========================
// === MESSAGE ROUTES ====
// ========================

app.post('/api/sessions/:sessionId/messages', authenticate, (req, res) => {
  const session = stmts.getSessionById.get(req.params.sessionId);
  if (!session || session.user_id !== req.userId) return res.status(404).json({ error: 'Session not found' });

  const { role, content, imageData, videoUri, audioData, metadata } = req.body;
  const id = uuidv4();
  stmts.createMessage.run(
    id, req.params.sessionId, role || 'user', content || null,
    imageData || null, videoUri || null, audioData || null,
    metadata ? JSON.stringify(metadata) : null
  );

  broadcastToUser(req.userId, { type: 'new_message', sessionId: req.params.sessionId, messageId: id });
  res.status(201).json({ messageId: id });
});

app.get('/api/sessions/:sessionId/messages', authenticate, (req, res) => {
  const session = stmts.getSessionById.get(req.params.sessionId);
  if (!session || session.user_id !== req.userId) return res.status(404).json({ error: 'Session not found' });
  const messages = stmts.getMessagesBySession.all(req.params.sessionId);
  res.json({ messages });
});

// ========================
// === TASK ROUTES ========
// ========================

app.post('/api/tasks', authenticate, (req, res) => {
  const { sessionId, title, description, status, priority, assignedAgent, parentTaskId, isParallel } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  const id = uuidv4();
  stmts.createTask.run(
    id, req.userId, sessionId || null, title, description || null,
    status || 'pending', priority || 'medium', assignedAgent || null,
    parentTaskId || null, isParallel ? 1 : 0
  );
  const task = stmts.getTaskById.get(id);
  broadcastToUser(req.userId, { type: 'task_created', task });
  res.status(201).json({ task });
});

app.get('/api/tasks', authenticate, (req, res) => {
  const tasks = stmts.getTasksByUser.all(req.userId);
  // Attach subtasks
  const withSubtasks = tasks.map(t => ({
    ...t,
    subtasks: stmts.getSubtasks.all(t.id)
  }));
  res.json({ tasks: withSubtasks });
});

app.get('/api/tasks/:id', authenticate, (req, res) => {
  const task = stmts.getTaskById.get(req.params.id);
  if (!task || task.user_id !== req.userId) return res.status(404).json({ error: 'Task not found' });
  task.subtasks = stmts.getSubtasks.all(task.id);
  res.json({ task });
});

app.patch('/api/tasks/:id', authenticate, (req, res) => {
  const task = stmts.getTaskById.get(req.params.id);
  if (!task || task.user_id !== req.userId) return res.status(404).json({ error: 'Task not found' });

  const { title, description, status, priority, assignedAgent } = req.body;
  stmts.updateTask.run(
    title || task.title,
    description !== undefined ? description : task.description,
    status || task.status,
    priority || task.priority,
    assignedAgent || task.assigned_agent,
    req.params.id
  );

  if (status) stmts.updateTaskStatus.run(status, status, req.params.id);

  const updated = stmts.getTaskById.get(req.params.id);
  broadcastToUser(req.userId, { type: 'task_updated', task: updated });
  res.json({ task: updated });
});

app.delete('/api/tasks/:id', authenticate, (req, res) => {
  const task = stmts.getTaskById.get(req.params.id);
  if (!task || task.user_id !== req.userId) return res.status(404).json({ error: 'Task not found' });
  stmts.deleteTask.run(req.params.id);
  broadcastToUser(req.userId, { type: 'task_deleted', taskId: req.params.id });
  res.json({ success: true });
});

// ========================
// === MEMORY ROUTES ======
// ========================

app.post('/api/memories', authenticate, (req, res) => {
  const { content, type, tags, relevance, isPinned } = req.body;
  if (!content) return res.status(400).json({ error: 'content is required' });

  const id = uuidv4();
  stmts.createMemory.run(
    id, req.userId, content, type || 'user_fact',
    JSON.stringify(tags || []), relevance || 0.0, isPinned ? 1 : 0
  );
  const memory = db.prepare('SELECT * FROM memories WHERE id = ?').get(id);
  res.status(201).json({ memory });
});

app.get('/api/memories', authenticate, (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const memories = stmts.getMemoriesByUser.all(req.userId, limit);
  const pinned = stmts.getPinnedMemories.all(req.userId);
  res.json({ memories, pinned });
});

app.get('/api/memories/search', authenticate, (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: 'q parameter required' });
  const results = stmts.searchMemories.all(req.userId, `%${q}%`, 20);
  res.json({ memories: results });
});

app.patch('/api/memories/:id/pin', authenticate, (req, res) => {
  const memory = db.prepare('SELECT * FROM memories WHERE id = ?').get(req.params.id);
  if (!memory || memory.user_id !== req.userId) return res.status(404).json({ error: 'Memory not found' });
  stmts.updateMemoryPin.run(memory.is_pinned ? 0 : 1, req.params.id);
  res.json({ memory: db.prepare('SELECT * FROM memories WHERE id = ?').get(req.params.id) });
});

app.delete('/api/memories/:id', authenticate, (req, res) => {
  const memory = db.prepare('SELECT * FROM memories WHERE id = ?').get(req.params.id);
  if (!memory || memory.user_id !== req.userId) return res.status(404).json({ error: 'Memory not found' });
  stmts.deleteMemory.run(req.params.id);
  res.json({ success: true });
});

app.delete('/api/memories', authenticate, (req, res) => {
  stmts.clearUnpinnedMemories.run(req.userId);
  res.json({ success: true });
});

// ========================
// === ASSET ROUTES =======
// ========================

app.post('/api/assets/upload', authenticate, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const id = uuidv4();
  stmts.createAsset.run(
    id, req.userId, req.file.filename, req.file.originalname,
    req.file.mimetype, req.file.size, req.file.path
  );
  const asset = stmts.getAssetById.get(id);
  res.status(201).json({
    asset,
    url: `/uploads/${req.file.filename}`
  });
});

app.get('/api/assets', authenticate, (req, res) => {
  const assets = stmts.getAssetsByUser.all(req.userId);
  res.json({ assets: assets.map(a => ({ ...a, url: `/uploads/${a.filename}` })) });
});

app.delete('/api/assets/:id', authenticate, (req, res) => {
  const asset = stmts.getAssetById.get(req.params.id);
  if (!asset || asset.user_id !== req.userId) return res.status(404).json({ error: 'Asset not found' });
  stmts.deleteAsset.run(req.params.id);
  res.json({ success: true });
});

// ========================
// === CANVAS ROUTES ======
// ========================

app.post('/api/canvas', authenticate, (req, res) => {
  const { sessionId, title, type, content } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  const id = uuidv4();
  stmts.createArtifact.run(id, req.userId, sessionId || null, title, type || 'html', content || '');
  const artifact = stmts.getArtifactById.get(id);
  res.status(201).json({ artifact });
});

app.get('/api/canvas', authenticate, (req, res) => {
  const artifacts = stmts.getArtifactsByUser.all(req.userId);
  res.json({ artifacts });
});

app.get('/api/canvas/:id', authenticate, (req, res) => {
  const artifact = stmts.getArtifactById.get(req.params.id);
  if (!artifact || artifact.user_id !== req.userId) return res.status(404).json({ error: 'Artifact not found' });
  res.json({ artifact });
});

app.put('/api/canvas/:id', authenticate, (req, res) => {
  const artifact = stmts.getArtifactById.get(req.params.id);
  if (!artifact || artifact.user_id !== req.userId) return res.status(404).json({ error: 'Artifact not found' });
  stmts.updateArtifact.run(req.body.title || artifact.title, req.body.content || artifact.content, req.params.id);
  res.json({ artifact: stmts.getArtifactById.get(req.params.id) });
});

app.delete('/api/canvas/:id', authenticate, (req, res) => {
  const artifact = stmts.getArtifactById.get(req.params.id);
  if (!artifact || artifact.user_id !== req.userId) return res.status(404).json({ error: 'Artifact not found' });
  stmts.deleteArtifact.run(req.params.id);
  res.json({ success: true });
});

// ========================
// === AI CHAT ROUTE ======
// ========================

app.post('/api/ai/chat', authenticate, async (req, res) => {
  try {
    const { prompt, model, systemInstruction, sessionId } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt is required' });

    if (!ai) {
      // Mock response when AI is not configured
      const mockResponse = {
        text: `[Demo Mode] I received your message: "${prompt}". The AI provider is not configured. Set the API_KEY environment variable to enable full AI capabilities.`,
        model: 'mock',
        usage: { promptTokens: 0, completionTokens: 0 }
      };

      if (sessionId) {
        const msgId = uuidv4();
        stmts.createMessage.run(msgId, sessionId, 'model', mockResponse.text, null, null, null, JSON.stringify({ model: 'mock' }));
      }

      return res.json({ response: mockResponse });
    }

    const response = await ai.models.generateContent({
      model: model || 'gemini-2.0-flash',
      contents: prompt,
      config: systemInstruction ? { systemInstruction } : undefined
    });

    const result = {
      text: response.text,
      model: model || 'gemini-2.0-flash'
    };

    if (sessionId) {
      const msgId = uuidv4();
      stmts.createMessage.run(msgId, sessionId, 'model', result.text, null, null, null, JSON.stringify({ model: result.model }));
      broadcastToUser(req.userId, { type: 'ai_response', sessionId, messageId: msgId });
    }

    res.json({ response: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================
// === AGENTS LIST ========
// ========================

app.get('/api/agents', (req, res) => {
  res.json({
    agents: [
      { id: 'OVERSEER', name: 'Overseer', description: 'Strategy & Orchestration', icon: 'Brain', category: 'Executive' },
      { id: 'DEVELOPER', name: 'Developer', description: 'Software Engineering & Code', icon: 'Code', category: 'Executor' },
      { id: 'VISIONARY', name: 'Visionary', description: 'Image Generation & Analysis', icon: 'Sparkles', category: 'Specialist' },
      { id: 'DIRECTOR', name: 'Director', description: 'Video Generation', icon: 'Film', category: 'Specialist' },
      { id: 'RESEARCHER', name: 'Researcher', description: 'Web Intelligence', icon: 'Globe', category: 'Specialist' },
      { id: 'DATA_ANALYST', name: 'Data Analyst', description: 'Data Aggregation & Analysis', icon: 'BarChart3', category: 'Specialist' },
      { id: 'COMMUNICATOR', name: 'Communicator', description: 'Live API, Transcription, TTS', icon: 'Mic', category: 'Operational' },
      { id: 'NAVIGATOR', name: 'Navigator', description: 'Geospatial Intelligence', icon: 'MapPin', category: 'Specialist' },
      { id: 'HR_MANAGER', name: 'HR Manager', description: 'Talent & Tool Discovery', icon: 'Users', category: 'Manager' },
      { id: 'INTEGRATION_LEAD', name: 'Integration Lead', description: 'API Integration & Tooling', icon: 'Network', category: 'Manager' },
      { id: 'SPEEDSTER', name: 'Speedster', description: 'Fast Lite Model', icon: 'Zap', category: 'Operational' },
      { id: 'ANTIGRAVITY', name: 'Antigravity', description: 'Infrastructure & DevOps', icon: 'Server', category: 'Executor' },
    ]
  });
});

// ========================
// === ANALYTICS ==========
// ========================

app.post('/api/analytics/track', authenticate, (req, res) => {
  const { eventName, meta } = req.body;
  if (!eventName) return res.status(400).json({ error: 'eventName is required' });
  stmts.trackEvent.run(req.userId, eventName, meta ? JSON.stringify(meta) : null);
  res.json({ success: true });
});

app.get('/api/analytics/events', authenticate, (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const events = stmts.getEvents.all(req.userId, limit);
  res.json({ events });
});

// ========================
// === MCP ORCHESTRATOR ===
// ========================

const HANDLERS = {
  fetch_data: async (params) => {
    return { data: "simulated_data", size: 1024, source: params.source };
  },
  transform_csv: async (params) => {
    return { status: "success", rows: 50, summary: `Aggregated by ${params.group_by}` };
  },
  call_model: async (params) => {
    if (!ai) return { error: "AI not configured" };
    const response = await ai.models.generateContent({
      model: params.model || "gemini-2.0-flash",
      contents: params.prompt || "Analyze this."
    });
    return { output: response.text };
  },
  schedule_job: async (params) => {
    return { jobId: uuidv4(), status: "scheduled", cron: params.cron };
  }
};

app.post('/api/mcp/execute', authenticate, async (req, res) => {
  try {
    const { prompt, dryRun } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt is required' });

    let plan;
    if (ai) {
      const systemPrompt = `You are the MCP Orchestrator. Convert the user's Natural Language request into a JSON Execution Plan. Available Handlers: ${Object.keys(HANDLERS).join(', ')}. Output: {"intent":"string","steps":[{"handler":"name","params":{}}]}`;
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: { responseMimeType: "application/json", systemInstruction: systemPrompt }
      });
      plan = JSON.parse(response.text);
    } else {
      plan = {
        intent: "demo_execution",
        steps: [
          { handler: "fetch_data", params: { source: "demo://data.csv" } },
          { handler: "call_model", params: { prompt: `Analyze: ${prompt}` } }
        ]
      };
    }

    if (dryRun) {
      return res.json({ plan, estimatedCost: plan.steps.length * 0.05, message: "Dry run complete" });
    }

    const results = [];
    for (const step of plan.steps) {
      const handler = HANDLERS[step.handler];
      if (!handler) { results.push({ step: step.handler, status: "error", error: "Unknown handler" }); break; }
      try {
        const result = await handler(step.params);
        results.push({ step: step.handler, status: "success", output: result });
      } catch (err) {
        results.push({ step: step.handler, status: "failed", error: err.message });
      }
    }

    res.json({ requestId: req.ctx.requestId, planIntent: plan.intent, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================
// === START SERVER =======
// ========================

server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║       LUXOR9 AI FACTORY — SERVER v2.0       ║
  ╠══════════════════════════════════════════════╣
  ║  HTTP:      http://localhost:${PORT}            ║
  ║  WebSocket: ws://localhost:${PORT}/ws           ║
  ║  Database:  ${DB_PATH.slice(-30).padStart(30)}  ║
  ║  AI:        ${(ai ? 'Connected' : 'Not configured').padStart(30)}  ║
  ╚══════════════════════════════════════════════╝
  `);
});
