/**
 * Luxor9 Ai Factory — Seed Script
 * Creates demo user and sample data
 */

import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, 'data', 'luxor9.db');

mkdirSync(join(__dirname, 'data'), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Ensure tables exist (server.js creates them, but seed can run standalone)
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, display_name TEXT, avatar_url TEXT,
    created_at INTEGER DEFAULT (unixepoch()), updated_at INTEGER DEFAULT (unixepoch()),
    last_login INTEGER, is_active INTEGER DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_type TEXT NOT NULL DEFAULT 'OVERSEER', title TEXT,
    created_at INTEGER DEFAULT (unixepoch()), updated_at INTEGER DEFAULT (unixepoch()), is_archived INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL, content TEXT, image_data TEXT, video_uri TEXT, audio_data TEXT,
    metadata_json TEXT, created_at INTEGER DEFAULT (unixepoch())
  );
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id TEXT REFERENCES sessions(id) ON DELETE SET NULL, title TEXT NOT NULL,
    description TEXT, status TEXT DEFAULT 'pending', priority TEXT DEFAULT 'medium',
    assigned_agent TEXT, parent_task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
    is_parallel INTEGER DEFAULT 0, output TEXT,
    created_at INTEGER DEFAULT (unixepoch()), updated_at INTEGER DEFAULT (unixepoch()), completed_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL, type TEXT DEFAULT 'user_fact', tags_json TEXT DEFAULT '[]',
    relevance REAL DEFAULT 0.0, is_pinned INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (unixepoch()), updated_at INTEGER DEFAULT (unixepoch())
  );
`);

// --- Create Demo User ---
const demoUserId = uuidv4();
const demoPassword = bcrypt.hashSync('demo123', 10);

try {
  db.prepare('INSERT INTO users (id, username, email, password_hash, display_name) VALUES (?, ?, ?, ?, ?)').run(
    demoUserId, 'demo', 'demo@luxor9.ai', demoPassword, 'Demo User'
  );
  console.log('Created demo user: demo / demo123');
} catch (e) {
  console.log('Demo user already exists, skipping...');
}

// --- Create Demo Session ---
const sessionId = uuidv4();
db.prepare('INSERT INTO sessions (id, user_id, agent_type, title) VALUES (?, ?, ?, ?)').run(
  sessionId, demoUserId, 'OVERSEER', 'Welcome to Luxor9 Ai Factory'
);

// --- Create Demo Messages ---
const messages = [
  { role: 'system', content: 'Welcome to Luxor9 Ai Factory. I am your Overseer agent, ready to coordinate the full power of our AI workforce.' },
  { role: 'user', content: 'Hello! What can you do?' },
  { role: 'model', content: 'I can orchestrate a team of specialized AI agents:\n\n**Developer** — Write, review, and execute code\n**Visionary** — Generate and analyze images\n**Director** — Create videos from text\n**Researcher** — Search the web and gather intelligence\n**Data Analyst** — Process and visualize data\n**Communicator** — Voice, transcription, and live sessions\n\nJust tell me what you need, and I will delegate to the right agent.' },
];

messages.forEach(msg => {
  db.prepare('INSERT INTO messages (id, session_id, role, content) VALUES (?, ?, ?, ?)').run(
    uuidv4(), sessionId, msg.role, msg.content
  );
});

// --- Create Demo Tasks ---
const tasks = [
  { title: 'Set up project architecture', status: 'completed', priority: 'high', agent: 'DEVELOPER' },
  { title: 'Generate brand assets', status: 'active', priority: 'medium', agent: 'VISIONARY' },
  { title: 'Research competitor landscape', status: 'pending', priority: 'medium', agent: 'RESEARCHER' },
  { title: 'Create demo video', status: 'pending', priority: 'low', agent: 'DIRECTOR' },
  { title: 'Analyze user metrics', status: 'pending', priority: 'high', agent: 'DATA_ANALYST' },
];

tasks.forEach(t => {
  db.prepare('INSERT INTO tasks (id, user_id, title, status, priority, assigned_agent) VALUES (?, ?, ?, ?, ?, ?)').run(
    uuidv4(), demoUserId, t.title, t.status, t.priority, t.agent
  );
});

// --- Create Demo Memories ---
const mems = [
  { content: 'User prefers dark mode interfaces with amber accents', type: 'user_fact', tags: ['preference', 'ui'], pinned: true },
  { content: 'Project uses React + Vite + Tailwind CSS frontend stack', type: 'system_note', tags: ['tech', 'stack'], pinned: true },
  { content: 'Luxor9 Ai Factory is an AI agent orchestration platform', type: 'system_note', tags: ['brand', 'product'], pinned: false },
  { content: 'User asked about multi-agent coordination patterns', type: 'interaction', tags: ['agents', 'architecture'], pinned: false },
  { content: 'MCP protocol used for tool integration', type: 'system_note', tags: ['protocol', 'mcp'], pinned: false },
];

mems.forEach(m => {
  db.prepare('INSERT INTO memories (id, user_id, content, type, tags_json, relevance, is_pinned) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    uuidv4(), demoUserId, m.content, m.type, JSON.stringify(m.tags), Math.random(), m.pinned ? 1 : 0
  );
});

console.log(`
  ╔══════════════════════════════════════╗
  ║   LUXOR9 AI FACTORY — SEED DATA     ║
  ╠══════════════════════════════════════╣
  ║  User:     demo / demo123           ║
  ║  Sessions: 1                        ║
  ║  Messages: 3                        ║
  ║  Tasks:    5                        ║
  ║  Memories: 5                        ║
  ╚══════════════════════════════════════╝
`);

db.close();
