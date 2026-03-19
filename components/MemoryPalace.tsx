import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Network, Search, Pin, PinOff, Trash2, Tag, Sparkles, Cpu,
  Database, Share2, Zap, Eye, Maximize2, Minimize2, RotateCcw,
  Globe, Code, Users, Target, Moon, Sun, Layers, Filter
} from 'lucide-react';

// --- Types ---
interface Memory {
  id: string;
  content: string;
  type: 'user_fact' | 'interaction' | 'system_note' | 'dream' | 'insight';
  tags: string[];
  relevance: number;
  isPinned: boolean;
  timestamp: number;
  connections: string[];
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

// --- Memory Colors by Type ---
const TYPE_COLORS: Record<string, { primary: string; glow: string; label: string }> = {
  user_fact: { primary: '#3b82f6', glow: 'rgba(59,130,246,0.3)', label: 'User Fact' },
  interaction: { primary: '#a855f7', glow: 'rgba(168,85,247,0.3)', label: 'Interaction' },
  system_note: { primary: '#f59e0b', glow: 'rgba(245,158,11,0.3)', label: 'System Note' },
  dream: { primary: '#ec4899', glow: 'rgba(236,72,153,0.3)', label: 'Dream' },
  insight: { primary: '#22c55e', glow: 'rgba(34,197,94,0.3)', label: 'Insight' },
};

// --- Initial Memories ---
const INITIAL_MEMORIES: Memory[] = [
  { id: 'mem1', content: 'User prefers dark mode interfaces with amber accents', type: 'user_fact', tags: ['preference', 'ui'], relevance: 0.95, isPinned: true, timestamp: Date.now() - 3600000, connections: ['mem2', 'mem5'] },
  { id: 'mem2', content: 'Project uses React + Vite + Tailwind CSS frontend stack', type: 'system_note', tags: ['tech', 'stack'], relevance: 0.9, isPinned: true, timestamp: Date.now() - 7200000, connections: ['mem1', 'mem3'] },
  { id: 'mem3', content: 'Luxor9 Ai Factory is an AI agent orchestration platform with 12 specialized agents', type: 'system_note', tags: ['brand', 'product', 'agents'], relevance: 0.85, isPinned: true, timestamp: Date.now() - 10800000, connections: ['mem2', 'mem4', 'mem6'] },
  { id: 'mem4', content: 'Agents can delegate tasks to each other via MCP protocol', type: 'system_note', tags: ['protocol', 'mcp', 'agents'], relevance: 0.8, isPinned: false, timestamp: Date.now() - 14400000, connections: ['mem3', 'mem6'] },
  { id: 'mem5', content: 'User asked about multi-agent coordination patterns in Factory Floor view', type: 'interaction', tags: ['agents', 'visualization'], relevance: 0.7, isPinned: false, timestamp: Date.now() - 18000000, connections: ['mem1', 'mem3'] },
  { id: 'mem6', content: 'Overseer coordinates all agents — it is the executive hub', type: 'system_note', tags: ['agents', 'architecture'], relevance: 0.88, isPinned: false, timestamp: Date.now() - 21600000, connections: ['mem3', 'mem4', 'mem7'] },
  { id: 'mem7', content: 'Developer agent handles code generation and refactoring tasks', type: 'system_note', tags: ['agents', 'developer'], relevance: 0.75, isPinned: false, timestamp: Date.now() - 25200000, connections: ['mem6'] },
  { id: 'mem8', content: 'Dreamed about a city made of code — buildings as functions, elevators as API calls', type: 'dream', tags: ['dream', 'metaphor', 'creative'], relevance: 0.6, isPinned: false, timestamp: Date.now() - 86400000, connections: ['mem3'] },
  { id: 'mem9', content: 'Glass morphism design represents clarity through complexity', type: 'insight', tags: ['design', 'philosophy'], relevance: 0.65, isPinned: false, timestamp: Date.now() - 43200000, connections: ['mem1', 'mem2'] },
  { id: 'mem10', content: 'Full stack deployment uses Coolify for self-hosted PaaS', type: 'system_note', tags: ['deployment', 'infrastructure'], relevance: 0.72, isPinned: false, timestamp: Date.now() - 50400000, connections: ['mem2'] },
  { id: 'mem11', content: 'The story-driven landing page: A Boy, A Chair, A World of Code', type: 'insight', tags: ['brand', 'story', 'ux'], relevance: 0.78, isPinned: true, timestamp: Date.now() - 57600000, connections: ['mem1', 'mem9'] },
  { id: 'mem12', content: 'ChatBoard connects to backend via JWT auth and WebSocket for real-time updates', type: 'system_note', tags: ['chat', 'websocket', 'auth'], relevance: 0.82, isPinned: false, timestamp: Date.now() - 64800000, connections: ['mem2', 'mem3'] },
];

// --- Canvas Visualization ---
function MemoryCanvas({ memories, selectedId, onSelect, filter }: {
  memories: Memory[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  filter: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const nodesRef = useRef<Memory[]>(memories.map(m => ({
    ...m,
    x: Math.random() * 80 + 10,
    y: Math.random() * 80 + 10,
    vx: (Math.random() - 0.5) * 0.15,
    vy: (Math.random() - 0.5) * 0.15,
    radius: m.isPinned ? 8 : 4 + m.relevance * 5,
  })));

  useEffect(() => {
    nodesRef.current = memories.map(m => ({
      ...m,
      x: nodesRef.current.find(n => n.id === m.id)?.x ?? Math.random() * 80 + 10,
      y: nodesRef.current.find(n => n.id === m.id)?.y ?? Math.random() * 80 + 10,
      vx: nodesRef.current.find(n => n.id === m.id)?.vx ?? (Math.random() - 0.5) * 0.15,
      vy: nodesRef.current.find(n => n.id === m.id)?.vy ?? (Math.random() - 0.5) * 0.15,
      radius: m.isPinned ? 8 : 4 + m.relevance * 5,
    }));
  }, [memories]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 800;
      canvas.height = canvas.parentElement?.clientHeight || 600;
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const nodes = nodesRef.current;
      const filteredIds = new Set(memories.filter(m =>
        filter === 'all' || m.type === filter
      ).map(m => m.id));

      // Physics + draw connections
      nodes.forEach((node, i) => {
        if (!filteredIds.has(node.id)) return;

        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 5 || node.x > 95) node.vx *= -1;
        if (node.y < 5 || node.y > 95) node.vy *= -1;

        // Draw connections
        node.connections.forEach(connId => {
          const other = nodes.find(n => n.id === connId);
          if (!other || !filteredIds.has(connId)) return;
          const dist = Math.hypot((node.x - other.x) * w / 100, (node.y - other.y) * h / 100);
          if (dist < 300) {
            const color = TYPE_COLORS[node.type];
            ctx.beginPath();
            ctx.moveTo((node.x / 100) * w, (node.y / 100) * h);
            ctx.lineTo((other.x / 100) * w, (other.y / 100) * h);
            ctx.strokeStyle = selectedId === node.id || selectedId === other.id
              ? `${color.primary}40`
              : 'rgba(255,255,255,0.04)';
            ctx.lineWidth = selectedId === node.id || selectedId === other.id ? 1.5 : 0.5;
            ctx.stroke();
          }
        });
      });

      // Draw nodes
      nodes.forEach(node => {
        if (!filteredIds.has(node.id)) return;
        const sx = (node.x / 100) * w;
        const sy = (node.y / 100) * h;
        const color = TYPE_COLORS[node.type];
        const isSelected = selectedId === node.id;
        const r = isSelected ? node.radius + 2 : node.radius;

        // Glow
        const gradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 4);
        gradient.addColorStop(0, isSelected ? color.glow : `${color.primary}20`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(sx, sy, r * 4, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = color.primary;
        ctx.beginPath();
        ctx.arc(sx, sy, r / 2, 0, Math.PI * 2);
        ctx.fill();

        // Ring
        ctx.strokeStyle = isSelected ? color.primary : `${color.primary}40`;
        ctx.lineWidth = isSelected ? 2 : 0.5;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.stroke();

        // Pinned indicator
        if (node.isPinned) {
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(sx + r - 1, sy - r + 1, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      animRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [memories, selectedId, filter]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    let closest: Memory | null = null;
    let minDist = 15;
    nodesRef.current.forEach(node => {
      const dist = Math.hypot(x - node.x, y - node.y);
      if (dist < minDist) {
        minDist = dist;
        closest = node;
      }
    });
    onSelect(closest?.id || '');
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-crosshair"
      onClick={handleCanvasClick}
    />
  );
}

// --- Main Memory Palace ---
export default function MemoryPalace() {
  const [memories, setMemories] = useState<Memory[]>(INITIAL_MEMORIES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const selectedMemory = memories.find(m => m.id === selectedId);

  const filteredMemories = memories.filter(m => {
    if (filterType !== 'all' && m.type !== filterType) return false;
    if (searchQuery && !m.content.toLowerCase().includes(searchQuery.toLowerCase()) && !m.tags.some(t => t.includes(searchQuery.toLowerCase()))) return false;
    return true;
  });

  const togglePin = (id: string) => {
    setMemories(prev => prev.map(m => m.id === id ? { ...m, isPinned: !m.isPinned } : m));
  };

  const deleteMemory = (id: string) => {
    setMemories(prev => prev.filter(m => m.id !== id).map(m => ({
      ...m,
      connections: m.connections.filter(c => c !== id),
    })));
    if (selectedId === id) setSelectedId(null);
  };

  // Stats
  const stats = useMemo(() => ({
    total: memories.length,
    pinned: memories.filter(m => m.isPinned).length,
    byType: Object.fromEntries(
      Object.keys(TYPE_COLORS).map(type => [type, memories.filter(m => m.type === type).length])
    ),
  }), [memories]);

  return (
    <div className={`flex flex-col h-full bg-[#02050A] text-white overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Network size={16} className="text-cyan-500" />
          </div>
          <div>
            <div className="text-sm font-semibold">Memory Palace</div>
            <div className="text-[10px] text-white/30 font-mono">NEURAL CORE VISUALIZATION</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-white/5 rounded-lg p-0.5">
            <button onClick={() => setViewMode('graph')} className={`px-2 py-1 rounded text-[9px] font-mono transition-all cursor-pointer ${viewMode === 'graph' ? 'bg-white/10 text-white' : 'text-white/30'}`}>
              Graph
            </button>
            <button onClick={() => setViewMode('list')} className={`px-2 py-1 rounded text-[9px] font-mono transition-all cursor-pointer ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/30'}`}>
              List
            </button>
          </div>

          <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 transition-all cursor-pointer">
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 shrink-0">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search memories..."
            className="w-full bg-white/5 border border-white/5 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-white/10"
          />
        </div>
        <div className="flex gap-1">
          {['all', ...Object.keys(TYPE_COLORS)].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2 py-1 rounded-lg text-[8px] font-mono capitalize transition-all cursor-pointer ${
                filterType === type ? 'bg-white/10 text-white' : 'text-white/20 hover:text-white/40'
              }`}
              style={filterType === type && type !== 'all' ? { color: TYPE_COLORS[type]?.primary } : {}}
            >
              {type === 'all' ? 'All' : TYPE_COLORS[type]?.label || type}
            </button>
          ))}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex min-h-0">
        {/* Canvas / List */}
        <div className="flex-1 relative overflow-hidden">
          {viewMode === 'graph' ? (
            <MemoryCanvas
              memories={filteredMemories}
              selectedId={selectedId}
              onSelect={setSelectedId}
              filter={filterType}
            />
          ) : (
            <div className="h-full overflow-y-auto p-4 space-y-2">
              {filteredMemories.map(mem => {
                const color = TYPE_COLORS[mem.type];
                return (
                  <div
                    key={mem.id}
                    onClick={() => setSelectedId(mem.id)}
                    className={`group p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedId === mem.id ? 'border-white/15 bg-white/[0.03]' : 'border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: color.primary }} />
                        <span className="text-[9px] font-mono uppercase" style={{ color: color.primary }}>{color.label}</span>
                        {mem.isPinned && <Pin size={9} className="text-amber-500 fill-amber-500" />}
                      </div>
                      <span className="text-[8px] text-white/15 font-mono">
                        {new Date(mem.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed mb-2">{mem.content}</p>
                    <div className="flex items-center gap-1 flex-wrap">
                      {mem.tags.map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 rounded bg-white/5 text-[8px] text-white/25 font-mono">{tag}</span>
                      ))}
                      <span className="text-[8px] text-white/15 font-mono ml-auto">{Math.round(mem.relevance * 100)}% relevance</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-4 left-4 flex items-center gap-3 text-[9px] font-mono text-white/25">
            {Object.entries(TYPE_COLORS).map(([type, config]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: config.primary }} />
                {config.label}
              </div>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedMemory && (
          <div className="w-72 border-l border-white/5 bg-black/30 overflow-y-auto shrink-0">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full" style={{ background: TYPE_COLORS[selectedMemory.type].primary }} />
                <span className="text-[9px] font-mono uppercase" style={{ color: TYPE_COLORS[selectedMemory.type].primary }}>
                  {TYPE_COLORS[selectedMemory.type].label}
                </span>
              </div>

              <p className="text-sm text-white/70 leading-relaxed mb-4">{selectedMemory.content}</p>

              {/* Tags */}
              <div className="mb-4">
                <div className="text-[8px] text-white/20 font-mono uppercase tracking-wider mb-1.5">Tags</div>
                <div className="flex flex-wrap gap-1">
                  {selectedMemory.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 text-[9px] text-white/30 font-mono">
                      <Tag size={8} /> {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Connections */}
              <div className="mb-4">
                <div className="text-[8px] text-white/20 font-mono uppercase tracking-wider mb-1.5">Connected Memories</div>
                <div className="space-y-1.5">
                  {selectedMemory.connections.map(connId => {
                    const conn = memories.find(m => m.id === connId);
                    if (!conn) return null;
                    return (
                      <button
                        key={connId}
                        onClick={() => setSelectedId(connId)}
                        className="w-full text-left p-2 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: TYPE_COLORS[conn.type].primary }} />
                          <span className="text-[8px] text-white/30 font-mono">{TYPE_COLORS[conn.type].label}</span>
                        </div>
                        <p className="text-[10px] text-white/40 line-clamp-2">{conn.content}</p>
                      </button>
                    );
                  })}
                  {selectedMemory.connections.length === 0 && (
                    <div className="text-[9px] text-white/15">No connections</div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2">
                  <div className="text-lg font-semibold" style={{ color: TYPE_COLORS[selectedMemory.type].primary }}>
                    {Math.round(selectedMemory.relevance * 100)}%
                  </div>
                  <div className="text-[8px] text-white/20 font-mono">Relevance</div>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2">
                  <div className="text-lg font-semibold text-white/50">{selectedMemory.connections.length}</div>
                  <div className="text-[8px] text-white/20 font-mono">Connections</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => togglePin(selectedMemory.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[9px] font-mono transition-all cursor-pointer"
                >
                  {selectedMemory.isPinned ? <PinOff size={11} /> : <Pin size={11} />}
                  {selectedMemory.isPinned ? 'Unpin' : 'Pin'}
                </button>
                <button
                  onClick={() => deleteMemory(selectedMemory.id)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[9px] font-mono transition-all cursor-pointer"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 bg-black/40 text-[9px] font-mono text-white/20">
        <div className="flex items-center gap-4">
          <span>{stats.total} memories</span>
          <span>{stats.pinned} pinned</span>
        </div>
        <div className="flex items-center gap-1">
          <Brain size={9} className="text-cyan-500/50" />
          <span>Neural Core Active</span>
        </div>
      </div>
    </div>
  );
}
