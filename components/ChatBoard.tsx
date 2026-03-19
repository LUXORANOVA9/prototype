import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Send, Paperclip, Image, Mic, Square, ChevronDown, Plus, Trash2,
  LogIn, LogOut, User, MessageSquare, Brain, Sparkles, Zap, Settings,
  PanelLeftClose, PanelLeft, Loader2, Copy, Check, RefreshCw
} from 'lucide-react';

// --- API Client ---
const API_BASE = typeof window !== 'undefined'
  ? (window as any).__LUXOR9_API_URL || `${window.location.protocol}//${window.location.hostname}:8080`
  : 'http://localhost:8080';

const WS_BASE = API_BASE.replace(/^http/, 'ws') + '/ws';

interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

async function api(path: string, options: ApiOptions = {}) {
  const token = localStorage.getItem('luxor9_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// --- Types ---
interface User {
  id: string;
  username: string;
  email: string;
  display_name: string;
}

interface Session {
  id: string;
  agent_type: string;
  title: string;
  created_at: number;
  updated_at: number;
}

interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  created_at: number;
  metadata_json?: string;
}

// --- Auth Screen ---
function AuthScreen({ onAuth }: { onAuth: (user: User) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let data;
      if (mode === 'login') {
        data = await api('/api/auth/login', { method: 'POST', body: { username, password } });
      } else {
        data = await api('/api/auth/register', { method: 'POST', body: { username, email, password, displayName: displayName || username } });
      }
      localStorage.setItem('luxor9_token', data.token);
      onAuth(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-full w-full bg-[#02050A] p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.3)]">
            <Brain size={24} className="text-black" />
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
            Luxor9 Ai Factory
          </h1>
          <p className="text-white/40 text-sm mt-1">Sign in to your factory</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 transition-colors"
              required
            />
          </div>
          {mode === 'register' && (
            <>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 transition-colors"
                required
              />
              <input
                type="text"
                placeholder="Display Name (optional)"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 transition-colors"
              />
            </>
          )}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 transition-colors"
            required
          />

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            className="text-white/40 hover:text-amber-500 text-sm transition-colors cursor-pointer"
          >
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// --- Message Bubble ---
function MessageBubble({ message, isLatest }: { message: ChatMessage; isLatest: boolean }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="text-[10px] text-white/30 font-mono uppercase tracking-wider bg-white/5 px-4 py-1.5 rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 group`}
    >
      <div className={`max-w-[80%] md:max-w-[70%] ${isUser ? 'order-2' : 'order-1'}`}>
        {!isUser && (
          <div className="flex items-center gap-2 mb-1.5 ml-1">
            <div className="w-5 h-5 rounded-md bg-amber-500/20 flex items-center justify-center">
              <Sparkles size={10} className="text-amber-500" />
            </div>
            <span className="text-[10px] text-white/30 font-mono uppercase tracking-wider">Luxor9</span>
          </div>
        )}
        <div
          className={`relative rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-amber-500/10 border border-amber-500/20 text-white/90'
              : 'bg-white/5 border border-white/8 text-white/80'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white/10 hover:bg-white/20 rounded-lg cursor-pointer"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-white/50" />}
          </button>
        </div>
        <div className={`text-[9px] text-white/20 mt-1 ${isUser ? 'text-right mr-1' : 'ml-1'}`}>
          {new Date(message.created_at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </motion.div>
  );
}

// --- Typing Indicator ---
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2 mb-4"
    >
      <div className="w-5 h-5 rounded-md bg-amber-500/20 flex items-center justify-center">
        <Sparkles size={10} className="text-amber-500" />
      </div>
      <div className="flex items-center gap-1 bg-white/5 border border-white/8 rounded-2xl px-4 py-3">
        <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </motion.div>
  );
}

// --- Main ChatBoard ---
export default function ChatBoard() {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prefersReduced = useReducedMotion();

  // Check auth on mount
  useEffect(() => {
    const token = localStorage.getItem('luxor9_token');
    if (token) {
      api('/api/auth/me')
        .then(data => setUser(data.user))
        .catch(() => localStorage.removeItem('luxor9_token'));
    }
    // Check backend health
    api('/health')
      .then(() => setConnectionStatus('connected'))
      .catch(() => setConnectionStatus('disconnected'));
  }, []);

  // Load sessions when user logs in
  useEffect(() => {
    if (user) {
      loadSessions();
      // Connect WebSocket
      connectWS();
    }
  }, [user]);

  // Load messages when session changes
  useEffect(() => {
    if (activeSession) {
      loadMessages(activeSession.id);
    }
  }, [activeSession]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const connectWS = () => {
    try {
      const ws = new WebSocket(WS_BASE);
      ws.onopen = () => {
        const token = localStorage.getItem('luxor9_token');
        if (token) ws.send(JSON.stringify({ type: 'auth', token }));
        setConnectionStatus('connected');
      };
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'new_message' && activeSession?.id === msg.sessionId) {
            loadMessages(msg.sessionId);
          }
          if (msg.type === 'ai_response' && activeSession?.id === msg.sessionId) {
            loadMessages(msg.sessionId);
            setIsSending(false);
          }
        } catch {}
      };
      ws.onclose = () => {
        setConnectionStatus('disconnected');
        setTimeout(connectWS, 3000);
      };
    } catch {}
  };

  const loadSessions = async () => {
    try {
      const data = await api('/api/sessions');
      setSessions(data.sessions);
      if (data.sessions.length > 0 && !activeSession) {
        setActiveSession(data.sessions[0]);
      }
    } catch {}
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const data = await api(`/api/sessions/${sessionId}/messages`);
      setMessages(data.messages);
    } catch {}
  };

  const createSession = async () => {
    try {
      const data = await api('/api/sessions', {
        method: 'POST',
        body: { agentType: 'OVERSEER', title: 'New Chat' },
      });
      setSessions(prev => [data.session, ...prev]);
      setActiveSession(data.session);
      setMessages([]);
    } catch {}
  };

  const deleteSession = async (sessionId: string) => {
    try {
      await api(`/api/sessions/${sessionId}`, { method: 'DELETE' });
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (activeSession?.id === sessionId) {
        setActiveSession(sessions.find(s => s.id !== sessionId) || null);
        setMessages([]);
      }
    } catch {}
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeSession || isSending) return;

    const userMessage = input.trim();
    setInput('');
    setIsSending(true);

    // Add user message optimistically
    const tempMsg: ChatMessage = {
      id: 'temp-' + Date.now(),
      session_id: activeSession.id,
      role: 'user',
      content: userMessage,
      created_at: Math.floor(Date.now() / 1000),
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      // Save user message to backend
      await api(`/api/sessions/${activeSession.id}/messages`, {
        method: 'POST',
        body: { role: 'user', content: userMessage },
      });

      // Get AI response
      await api('/api/ai/chat', {
        method: 'POST',
        body: { prompt: userMessage, sessionId: activeSession.id },
      });

      // Reload messages to get the real ones
      await loadMessages(activeSession.id);
    } catch (err: any) {
      // Add error message
      const errorMsg: ChatMessage = {
        id: 'error-' + Date.now(),
        session_id: activeSession.id,
        role: 'model',
        content: `Error: ${err.message}. Make sure the backend is running and API_KEY is configured.`,
        created_at: Math.floor(Date.now() / 1000),
      };
      setMessages(prev => [...prev.filter(m => m.id !== tempMsg.id), errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('luxor9_token');
    setUser(null);
    setSessions([]);
    setActiveSession(null);
    setMessages([]);
  };

  // --- Auth Screen ---
  if (!user) {
    return <AuthScreen onAuth={setUser} />;
  }

  // --- Main Chat UI ---
  return (
    <div className="flex h-full w-full bg-[#02050A] text-white overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 0.84, 0.24, 1] }}
            className="h-full border-r border-white/5 flex flex-col bg-black/40 overflow-hidden shrink-0"
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                    <Brain size={16} className="text-black" />
                  </div>
                  <span className="font-semibold text-sm">Luxor9</span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                >
                  <PanelLeftClose size={16} className="text-white/40" />
                </button>
              </div>

              <button
                onClick={createSession}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 hover:border-amber-500/30 text-sm font-medium transition-all cursor-pointer"
              >
                <Plus size={16} />
                New Chat
              </button>
            </div>

            {/* Session List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {sessions.map(session => (
                <div
                  key={session.id}
                  onClick={() => setActiveSession(session)}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                    activeSession?.id === session.id
                      ? 'bg-white/8 border border-white/10'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <MessageSquare size={14} className={activeSession?.id === session.id ? 'text-amber-500' : 'text-white/30'} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{session.title || 'Untitled'}</div>
                    <div className="text-[10px] text-white/30 font-mono">{session.agent_type}</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all cursor-pointer"
                  >
                    <Trash2 size={12} className="text-red-400" />
                  </button>
                </div>
              ))}
              {sessions.length === 0 && (
                <div className="text-center text-white/20 text-xs py-8">
                  No conversations yet
                </div>
              )}
            </div>

            {/* Sidebar Footer */}
            <div className="p-3 border-t border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                    <User size={14} className="text-white/60" />
                  </div>
                  <div className="text-xs">
                    <div className="font-medium">{user.display_name}</div>
                    <div className="text-white/30 text-[10px]">@{user.username}</div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                  title="Logout"
                >
                  <LogOut size={14} className="text-white/40" />
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/20">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              >
                <PanelLeft size={16} className="text-white/40" />
              </button>
            )}
            {activeSession ? (
              <>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Zap size={16} className="text-amber-500" />
                </div>
                <div>
                  <div className="text-sm font-medium">{activeSession.title || 'Chat'}</div>
                  <div className="text-[10px] text-white/30 font-mono uppercase">{activeSession.agent_type} Agent</div>
                </div>
              </>
            ) : (
              <span className="text-sm text-white/30">Select or create a conversation</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' :
              connectionStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
            }`} />
            <span className="text-[10px] text-white/30 font-mono">
              {connectionStatus === 'connected' ? 'Online' : connectionStatus === 'disconnected' ? 'Offline' : '...'}
            </span>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {!activeSession ? (
            <div className="flex flex-col items-center justify-center h-full text-white/20 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
                <MessageSquare size={24} />
              </div>
              <div className="text-center">
                <div className="text-sm font-medium mb-1">Welcome to Luxor9 Ai Factory</div>
                <div className="text-xs">Create a new chat to get started</div>
              </div>
              <button
                onClick={createSession}
                className="mt-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-full text-sm font-semibold transition-all cursor-pointer"
              >
                Start Chatting
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/20 gap-3">
              <Sparkles size={32} className="text-amber-500/40" />
              <div className="text-center">
                <div className="text-sm font-medium text-white/40 mb-1">Start the conversation</div>
                <div className="text-xs">Send a message to begin working with your AI agent</div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <MessageBubble key={msg.id} message={msg} isLatest={i === messages.length - 1} />
              ))}
              {isSending && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        {activeSession && (
          <div className="px-4 pb-4 pt-2">
            <div className="relative flex items-end gap-2 bg-white/5 border border-white/8 focus-within:border-amber-500/30 rounded-2xl p-2 transition-colors">
              <button className="p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer shrink-0">
                <Paperclip size={18} className="text-white/30" />
              </button>

              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Luxor9..."
                rows={1}
                className="flex-1 bg-transparent resize-none text-sm text-white placeholder:text-white/25 focus:outline-none py-2 max-h-32"
                style={{ minHeight: '24px' }}
              />

              <button
                onClick={sendMessage}
                disabled={!input.trim() || isSending}
                className="p-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-white/5 disabled:text-white/20 text-black rounded-xl transition-all cursor-pointer shrink-0"
              >
                {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
            <div className="text-center mt-2">
              <span className="text-[9px] text-white/15 font-mono">Luxor9 Ai Factory — Powered by Gemini</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
