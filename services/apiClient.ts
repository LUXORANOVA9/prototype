/**
 * Luxor9 Ai Factory — API Client Service
 * Connects frontend to the full-stack backend
 */

// Detect backend URL:
// 1. Window global override (for runtime config)
// 2. Same-origin /api path (when behind reverse proxy)
// 3. Localhost:8080 (development)
function getApiBase(): string {
  if (typeof window !== 'undefined') {
    // Runtime override
    if ((window as any).__LUXOR9_API_URL) return (window as any).__LUXOR9_API_URL;
    // Check if we're on a deployed domain (not localhost)
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      // Try same-origin first (works with reverse proxy like nginx)
      return `${window.location.protocol}//${window.location.host}`;
    }
    // Local development
    return `${window.location.protocol}//${window.location.hostname}:8080`;
  }
  return 'http://localhost:8080';
}

const API_BASE = getApiBase();

const WS_BASE = typeof window !== 'undefined'
  ? (() => {
      if ((window as any).__LUXOR9_WS_URL) return (window as any).__LUXOR9_WS_URL;
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        return `${proto}//${window.location.host}/ws`;
      }
      return `${proto}//${window.location.hostname}:8080/ws`;
    })()
  : 'ws://localhost:8080/ws';

let authToken: string | null = null;
let wsConnection: WebSocket | null = null;
let wsListeners: Map<string, Set<(data: any) => void>> = new Map();

// --- Token Management ---
export function setToken(token: string) {
  authToken = token;
  localStorage.setItem('luxor9_token', token);
}

export function getToken(): string | null {
  if (!authToken) authToken = localStorage.getItem('luxor9_token');
  return authToken;
}

export function clearToken() {
  authToken = null;
  localStorage.removeItem('luxor9_token');
}

// --- HTTP Helper ---
async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// --- WebSocket ---
export function connectWebSocket(): WebSocket | null {
  if (typeof window === 'undefined') return null;
  if (wsConnection && wsConnection.readyState === WebSocket.OPEN) return wsConnection;

  wsConnection = new WebSocket(`${WS_BASE}/ws`);

  wsConnection.onopen = () => {
    const token = getToken();
    if (token && wsConnection) {
      wsConnection.send(JSON.stringify({ type: 'auth', token }));
    }
  };

  wsConnection.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      const listeners = wsListeners.get(msg.type);
      if (listeners) listeners.forEach(fn => fn(msg));
      // Also fire 'all' listeners
      const allListeners = wsListeners.get('all');
      if (allListeners) allListeners.forEach(fn => fn(msg));
    } catch {}
  };

  wsConnection.onclose = () => {
    // Auto-reconnect after 3s
    setTimeout(() => {
      if (getToken()) connectWebSocket();
    }, 3000);
  };

  return wsConnection;
}

export function onWsMessage(type: string, callback: (data: any) => void) {
  if (!wsListeners.has(type)) wsListeners.set(type, new Set());
  wsListeners.get(type)!.add(callback);
  return () => wsListeners.get(type)?.delete(callback);
}

// --- Auth API ---
export const auth = {
  register: (username: string, email: string, password: string, displayName?: string) =>
    apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, displayName }),
    }),

  login: (username: string, password: string) =>
    apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  me: () => apiFetch('/api/auth/me'),
};

// --- Sessions API ---
export const sessions = {
  create: (agentType?: string, title?: string) =>
    apiFetch('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ agentType, title }),
    }),

  list: () => apiFetch('/api/sessions'),

  get: (id: string) => apiFetch(`/api/sessions/${id}`),

  update: (id: string, data: { title?: string }) =>
    apiFetch(`/api/sessions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch(`/api/sessions/${id}`, { method: 'DELETE' }),
};

// --- Messages API ---
export const messages = {
  send: (sessionId: string, data: { role: string; content?: string; imageData?: string; metadata?: any }) =>
    apiFetch(`/api/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  list: (sessionId: string) => apiFetch(`/api/sessions/${sessionId}/messages`),
};

// --- Tasks API ---
export const tasks = {
  create: (data: {
    title: string;
    description?: string;
    sessionId?: string;
    status?: string;
    priority?: string;
    assignedAgent?: string;
    parentTaskId?: string;
    isParallel?: boolean;
  }) => apiFetch('/api/tasks', { method: 'POST', body: JSON.stringify(data) }),

  list: () => apiFetch('/api/tasks'),

  get: (id: string) => apiFetch(`/api/tasks/${id}`),

  update: (id: string, data: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    assignedAgent?: string;
  }) => apiFetch(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) => apiFetch(`/api/tasks/${id}`, { method: 'DELETE' }),
};

// --- Memories API ---
export const memories = {
  create: (data: {
    content: string;
    type?: string;
    tags?: string[];
    relevance?: number;
    isPinned?: boolean;
  }) => apiFetch('/api/memories', { method: 'POST', body: JSON.stringify(data) }),

  list: (limit?: number) => apiFetch(`/api/memories${limit ? `?limit=${limit}` : ''}`),

  search: (query: string) => apiFetch(`/api/memories/search?q=${encodeURIComponent(query)}`),

  togglePin: (id: string) => apiFetch(`/api/memories/${id}/pin`, { method: 'PATCH' }),

  delete: (id: string) => apiFetch(`/api/memories/${id}`, { method: 'DELETE' }),

  clear: () => apiFetch('/api/memories', { method: 'DELETE' }),
};

// --- Assets API ---
export const assets = {
  upload: async (file: File) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/api/assets/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  },

  list: () => apiFetch('/api/assets'),

  delete: (id: string) => apiFetch(`/api/assets/${id}`, { method: 'DELETE' }),
};

// --- Canvas API ---
export const canvas = {
  create: (data: { title: string; type?: string; content?: string; sessionId?: string }) =>
    apiFetch('/api/canvas', { method: 'POST', body: JSON.stringify(data) }),

  list: () => apiFetch('/api/canvas'),

  get: (id: string) => apiFetch(`/api/canvas/${id}`),

  update: (id: string, data: { title?: string; content?: string }) =>
    apiFetch(`/api/canvas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) => apiFetch(`/api/canvas/${id}`, { method: 'DELETE' }),
};

// --- AI API ---
export const aiApi = {
  chat: (data: { prompt: string; model?: string; systemInstruction?: string; sessionId?: string }) =>
    apiFetch('/api/ai/chat', { method: 'POST', body: JSON.stringify(data) }),
};

// --- MCP API ---
export const mcpApi = {
  execute: (data: { prompt: string; dryRun?: boolean }) =>
    apiFetch('/api/mcp/execute', { method: 'POST', body: JSON.stringify(data) }),
};

// --- Analytics API ---
export const analyticsApi = {
  track: (eventName: string, meta?: any) =>
    apiFetch('/api/analytics/track', {
      method: 'POST',
      body: JSON.stringify({ eventName, meta }),
    }),

  events: (limit?: number) =>
    apiFetch(`/api/analytics/events${limit ? `?limit=${limit}` : ''}`),
};

// --- Agents API ---
export const agentsApi = {
  list: () => apiFetch('/api/agents'),
};

// --- Health ---
export const health = () => apiFetch('/health');

// Export everything
export default {
  setToken,
  getToken,
  clearToken,
  connectWebSocket,
  onWsMessage,
  auth,
  sessions,
  messages,
  tasks,
  memories,
  assets,
  canvas,
  aiApi,
  mcpApi,
  analyticsApi,
  agentsApi,
  health,
};
