import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Code, Sparkles, Film, Globe, BarChart3, Mic, MapPin,
  Users, Network, Zap, Server, Activity, Radio, ArrowRight,
  Play, Pause, RotateCcw, Maximize2, Minimize2, ChevronRight,
  Circle, Cpu, Eye, Target, Layers, Shield
} from 'lucide-react';

// --- Types ---
interface Agent {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  glowColor: string;
  category: 'executive' | 'specialist' | 'executor' | 'operational' | 'manager';
  status: 'idle' | 'active' | 'thinking' | 'streaming' | 'delegating';
  x: number;
  y: number;
  connections: string[];
  task?: string;
  pulsePhase: number;
}

interface DataStream {
  id: string;
  from: string;
  to: string;
  progress: number;
  type: 'task' | 'data' | 'delegation' | 'result';
  label: string;
}

interface ActivityLog {
  id: string;
  timestamp: number;
  agent: string;
  action: string;
  type: 'delegation' | 'completion' | 'error' | 'info';
}

// --- Agent Definitions ---
const AGENTS: Agent[] = [
  { id: 'OVERSEER', name: 'Overseer', icon: Brain, color: '#f59e0b', glowColor: 'rgba(245,158,11,0.4)', category: 'executive', status: 'active', x: 50, y: 30, connections: ['DEVELOPER', 'VISIONARY', 'RESEARCHER', 'DATA_ANALYST', 'COMMUNICATOR', 'DIRECTOR'], pulsePhase: 0 },
  { id: 'DEVELOPER', name: 'Developer', icon: Code, color: '#3b82f6', glowColor: 'rgba(59,130,246,0.4)', category: 'executor', status: 'idle', x: 20, y: 55, connections: ['OVERSEER'], pulsePhase: 1 },
  { id: 'VISIONARY', name: 'Visionary', icon: Sparkles, color: '#a855f7', glowColor: 'rgba(168,85,247,0.4)', category: 'specialist', status: 'idle', x: 80, y: 55, connections: ['OVERSEER'], pulsePhase: 2 },
  { id: 'DIRECTOR', name: 'Director', icon: Film, color: '#ec4899', glowColor: 'rgba(236,72,153,0.4)', category: 'specialist', status: 'idle', x: 90, y: 75, connections: ['OVERSEER', 'VISIONARY'], pulsePhase: 3 },
  { id: 'RESEARCHER', name: 'Researcher', icon: Globe, color: '#22c55e', glowColor: 'rgba(34,197,94,0.4)', category: 'specialist', status: 'idle', x: 35, y: 70, connections: ['OVERSEER'], pulsePhase: 4 },
  { id: 'DATA_ANALYST', name: 'Data Analyst', icon: BarChart3, color: '#06b6d4', glowColor: 'rgba(6,182,212,0.4)', category: 'specialist', status: 'idle', x: 65, y: 70, connections: ['OVERSEER', 'RESEARCHER'], pulsePhase: 5 },
  { id: 'COMMUNICATOR', name: 'Communicator', icon: Mic, color: '#f97316', glowColor: 'rgba(249,115,22,0.4)', category: 'operational', status: 'idle', x: 50, y: 85, connections: ['OVERSEER'], pulsePhase: 6 },
  { id: 'NAVIGATOR', name: 'Navigator', icon: MapPin, color: '#14b8a6', glowColor: 'rgba(20,184,166,0.4)', category: 'specialist', status: 'idle', x: 10, y: 75, connections: ['OVERSEER', 'RESEARCHER'], pulsePhase: 7 },
  { id: 'HR_MANAGER', name: 'HR Manager', icon: Users, color: '#8b5cf6', glowColor: 'rgba(139,92,246,0.4)', category: 'manager', status: 'idle', x: 15, y: 40, connections: ['OVERSEER'], pulsePhase: 8 },
  { id: 'INTEGRATION_LEAD', name: 'Integration', icon: Network, color: '#6366f1', glowColor: 'rgba(99,102,241,0.4)', category: 'manager', status: 'idle', x: 85, y: 40, connections: ['OVERSEER', 'DEVELOPER'], pulsePhase: 9 },
  { id: 'SPEEDSTER', name: 'Speedster', icon: Zap, color: '#eab308', glowColor: 'rgba(234,179,8,0.4)', category: 'operational', status: 'idle', x: 30, y: 25, connections: ['OVERSEER'], pulsePhase: 10 },
  { id: 'ANTIGRAVITY', name: 'Antigravity', icon: Server, color: '#ef4444', glowColor: 'rgba(239,68,68,0.4)', category: 'executor', status: 'idle', x: 70, y: 25, connections: ['OVERSEER', 'DEVELOPER'], pulsePhase: 11 },
];

const STATUS_LABELS: Record<string, string> = {
  idle: 'Standing By',
  active: 'Active',
  thinking: 'Processing',
  streaming: 'Streaming',
  delegating: 'Delegating',
};

const CATEGORY_COLORS: Record<string, string> = {
  executive: '#f59e0b',
  specialist: '#3b82f6',
  executor: '#ef4444',
  operational: '#22c55e',
  manager: '#a855f7',
};

// --- Data Stream Particle ---
function StreamParticle({ stream, agents }: { stream: DataStream; agents: Agent[] }) {
  const fromAgent = agents.find(a => a.id === stream.from);
  const toAgent = agents.find(a => a.id === stream.to);
  if (!fromAgent || !toAgent) return null;

  const x = fromAgent.x + (toAgent.x - fromAgent.x) * stream.progress;
  const y = fromAgent.y + (toAgent.y - fromAgent.y) * stream.progress;

  const colors: Record<string, string> = {
    task: '#f59e0b',
    data: '#3b82f6',
    delegation: '#a855f7',
    result: '#22c55e',
  };

  return (
    <g>
      <circle
        cx={`${x}%`}
        cy={`${y}%`}
        r="4"
        fill={colors[stream.type] || '#f59e0b'}
        opacity={0.9}
      >
        <animate attributeName="r" values="3;5;3" dur="0.8s" repeatCount="indefinite" />
      </circle>
      <circle
        cx={`${x}%`}
        cy={`${y}%`}
        r="12"
        fill={colors[stream.type] || '#f59e0b'}
        opacity={0.15}
      />
    </g>
  );
}

// --- Connection Line ---
function ConnectionLine({ from, to, isActive, streamProgress }: { from: Agent; to: Agent; isActive: boolean; streamProgress?: number }) {
  const opacity = isActive ? 0.4 : 0.08;
  const color = isActive ? from.color : 'rgba(255,255,255,0.15)';

  return (
    <g>
      <line
        x1={`${from.x}%`}
        y1={`${from.y}%`}
        x2={`${to.x}%`}
        y2={`${to.y}%`}
        stroke={color}
        strokeWidth={isActive ? 1.5 : 0.5}
        opacity={opacity}
        strokeDasharray={isActive ? 'none' : '4 4'}
      />
      {isActive && streamProgress !== undefined && (
        <line
          x1={`${from.x}%`}
          y1={`${from.y}%`}
          x2={`${from.x + (to.x - from.x) * streamProgress}%`}
          y2={`${from.y + (to.y - from.y) * streamProgress}%`}
          stroke={from.color}
          strokeWidth={2}
          opacity={0.6}
          strokeLinecap="round"
        />
      )}
    </g>
  );
}

// --- Agent Node ---
function AgentNode({ agent, isActive, onClick, scale }: { agent: Agent; isActive: boolean; onClick: () => void; scale: number }) {
  const Icon = agent.icon;
  const size = agent.id === 'OVERSEER' ? 52 : 40;
  const pulseDelay = agent.pulsePhase * 0.3;

  return (
    <g
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Outer glow ring */}
      {isActive && (
        <circle
          cx={`${agent.x}%`}
          cy={`${agent.y}%`}
          r={size / scale + 8}
          fill="none"
          stroke={agent.color}
          strokeWidth={1}
          opacity={0.3}
        >
          <animate attributeName="r" values={`${size/scale + 6};${size/scale + 12};${size/scale + 6}`} dur="2s" begin={`${pulseDelay}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" begin={`${pulseDelay}s`} repeatCount="indefinite" />
        </circle>
      )}

      {/* Pulse ring */}
      <circle
        cx={`${agent.x}%`}
        cy={`${agent.y}%`}
        r={size / scale}
        fill="none"
        stroke={agent.color}
        strokeWidth={isActive ? 2 : 0.5}
        opacity={isActive ? 0.5 : 0.1}
      />

      {/* Background */}
      <circle
        cx={`${agent.x}%`}
        cy={`${agent.y}%`}
        r={size / scale - 2}
        fill={isActive ? `${agent.color}15` : 'rgba(255,255,255,0.03)'}
      />

      {/* Status indicator */}
      <circle
        cx={`${agent.x + (size / scale / 2) / 1.5}%`}
        cy={`${agent.y - (size / scale / 2) / 1.5}%`}
        r={3}
        fill={agent.status === 'active' || agent.status === 'thinking' ? '#22c55e' : agent.status === 'streaming' ? '#f59e0b' : '#555'}
      >
        {(agent.status === 'active' || agent.status === 'thinking') && (
          <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
        )}
      </circle>
    </g>
  );
}

// --- Activity Feed ---
function ActivityFeed({ logs }: { logs: ActivityLog[] }) {
  return (
    <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
      <AnimatePresence mode="popLayout">
        {logs.slice(0, 20).map((log) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, x: -20, height: 0 }}
            animate={{ opacity: 1, x: 0, height: 'auto' }}
            exit={{ opacity: 0, x: 20, height: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-start gap-2 text-[10px] leading-relaxed"
          >
            <span className="text-white/20 font-mono shrink-0 w-12">
              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className={`shrink-0 font-bold ${
              log.type === 'delegation' ? 'text-amber-500' :
              log.type === 'completion' ? 'text-emerald-500' :
              log.type === 'error' ? 'text-red-500' :
              'text-white/40'
            }`}>
              {log.agent}
            </span>
            <span className="text-white/50">{log.action}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// --- Main Factory Floor ---
export default function FactoryFloor() {
  const canvasRef = useRef<SVGSVGElement>(null);
  const [agents, setAgents] = useState<Agent[]>(AGENTS);
  const [streams, setStreams] = useState<DataStream[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>('OVERSEER');
  const [isSimulating, setIsSimulating] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(1);
  const animFrameRef = useRef<number>(0);

  // Simulation engine
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      // Randomly activate agents
      setAgents(prev => {
        const updated = [...prev];
        
        // Randomly change a status
        const randIdx = Math.floor(Math.random() * updated.length);
        const agent = { ...updated[randIdx] };
        const statuses: Agent['status'][] = ['idle', 'active', 'thinking', 'streaming', 'delegating'];
        const oldStatus = agent.status;
        
        if (Math.random() > 0.6) {
          agent.status = statuses[Math.floor(Math.random() * statuses.length)];
          agent.task = agent.status !== 'idle' ? getRandomTask(agent.id) : undefined;
          updated[randIdx] = agent;

          // Log activity
          if (oldStatus !== agent.status) {
            const newLog: ActivityLog = {
              id: `log-${Date.now()}-${Math.random()}`,
              timestamp: Date.now(),
              agent: agent.name,
              action: agent.status === 'idle' ? 'completed task' :
                      agent.status === 'delegating' ? `delegating to ${getRandomTarget(agent.id)}` :
                      agent.status === 'thinking' ? 'processing request' :
                      agent.status === 'streaming' ? 'streaming results' :
                      'working on task',
              type: agent.status === 'delegating' ? 'delegation' :
                    agent.status === 'idle' ? 'completion' : 'info',
            };
            setActivityLogs(prev => [newLog, ...prev].slice(0, 50));
          }
        }

        return updated;
      });

      // Create data streams
      if (Math.random() > 0.5) {
        const fromAgent = agents[Math.floor(Math.random() * agents.length)];
        const connection = fromAgent.connections[Math.floor(Math.random() * fromAgent.connections.length)];
        if (connection) {
          const streamTypes: DataStream['type'][] = ['task', 'data', 'delegation', 'result'];
          const newStream: DataStream = {
            id: `stream-${Date.now()}`,
            from: fromAgent.id,
            to: connection,
            progress: 0,
            type: streamTypes[Math.floor(Math.random() * streamTypes.length)],
            label: `${fromAgent.id} → ${connection}`,
          };
          setStreams(prev => [...prev, newStream].slice(0, 8));
        }
      }

      // Update stream progress
      setStreams(prev => prev
        .map(s => ({ ...s, progress: s.progress + 0.04 }))
        .filter(s => s.progress < 1)
      );

    }, 800);

    return () => clearInterval(interval);
  }, [isSimulating, agents]);

  const getRandomTask = (agentId: string): string => {
    const tasks: Record<string, string[]> = {
      OVERSEER: ['Coordinating agent team', 'Analyzing request', 'Delegating to specialist'],
      DEVELOPER: ['Writing React component', 'Building API endpoint', 'Refactoring code'],
      VISIONARY: ['Generating hero image', 'Creating logo concept', 'Analyzing screenshot'],
      DIRECTOR: ['Rendering video scene', 'Compositing frames', 'Storyboarding'],
      RESEARCHER: ['Searching market data', 'Analyzing competitors', 'Gathering intelligence'],
      DATA_ANALYST: ['Processing dataset', 'Building visualization', 'Running analysis'],
      COMMUNICATOR: ['Transcribing audio', 'Generating speech', 'Live session active'],
      NAVIGATOR: ['Locating resources', 'Mapping coordinates', 'Route optimization'],
      HR_MANAGER: ['Scanning tools', 'Evaluating integrations', 'Discovery scan'],
      INTEGRATION_LEAD: ['Connecting API', 'Configuring MCP', 'Testing endpoint'],
      SPEEDSTER: ['Quick response', 'Rapid inference', 'Fast classification'],
      ANTIGRAVITY: ['Deploying container', 'Scaling infrastructure', 'Running diagnostics'],
    };
    const list = tasks[agentId] || ['Processing...'];
    return list[Math.floor(Math.random() * list.length)];
  };

  const getRandomTarget = (fromId: string): string => {
    const agent = agents.find(a => a.id === fromId);
    if (!agent || agent.connections.length === 0) return 'unknown';
    return agent.connections[Math.floor(Math.random() * agent.connections.length)];
  };

  const handleAgentClick = (agentId: string) => {
    setSelectedAgent(agentId === selectedAgent ? null : agentId);
  };

  const resetSimulation = () => {
    setAgents(AGENTS);
    setStreams([]);
    setActivityLogs([]);
    setIsSimulating(true);
  };

  const selectedAgentData = agents.find(a => a.id === selectedAgent);

  // Stats
  const stats = useMemo(() => ({
    active: agents.filter(a => a.status !== 'idle').length,
    idle: agents.filter(a => a.status === 'idle').length,
    streams: streams.length,
    totalLogs: activityLogs.length,
  }), [agents, streams, activityLogs]);

  return (
    <div className={`flex flex-col h-full bg-[#02050A] text-white overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Activity size={16} className="text-amber-500" />
          </div>
          <div>
            <div className="text-sm font-semibold">Factory Floor</div>
            <div className="text-[10px] text-white/30 font-mono">REAL-TIME AGENT ORCHESTRATION</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Stats */}
          <div className="hidden md:flex items-center gap-4 mr-4 text-[10px] font-mono">
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
              {stats.active} Active
            </span>
            <span className="flex items-center gap-1.5 text-white/30">
              <div className="w-2 h-2 rounded-full bg-white/20" />
              {stats.idle} Idle
            </span>
            <span className="flex items-center gap-1.5 text-amber-500/60">
              <Radio size={10} />
              {stats.streams} Streams
            </span>
          </div>

          {/* Controls */}
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              isSimulating ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : 'bg-white/5 text-white/40 hover:bg-white/10'
            }`}
            title={isSimulating ? 'Pause' : 'Play'}
          >
            {isSimulating ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            onClick={resetSimulation}
            className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 transition-all cursor-pointer"
            title="Reset"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 transition-all cursor-pointer"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <svg
            ref={canvasRef}
            className="w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Grid background */}
            <defs>
              <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
                <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.1" />
              </pattern>
              <radialGradient id="centerGlow" cx="50%" cy="30%" r="40%">
                <stop offset="0%" stopColor="rgba(245,158,11,0.06)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
            <rect width="100" height="100" fill="url(#centerGlow)" />

            {/* Connection lines */}
            {agents.map(agent =>
              agent.connections.map(connId => {
                const target = agents.find(a => a.id === connId);
                if (!target) return null;
                const isActive = agent.status !== 'idle' || target.status !== 'idle';
                const streamOnLine = streams.find(s =>
                  (s.from === agent.id && s.to === connId) ||
                  (s.from === connId && s.to === agent.id)
                );
                return (
                  <ConnectionLine
                    key={`${agent.id}-${connId}`}
                    from={agent}
                    to={target}
                    isActive={isActive}
                    streamProgress={streamOnLine?.progress}
                  />
                );
              })
            )}

            {/* Data streams */}
            {streams.map(stream => (
              <StreamParticle key={stream.id} stream={stream} agents={agents} />
            ))}

            {/* Agent nodes (rendered as foreignObject for icons) */}
            {agents.map(agent => {
              const isActive = agent.status !== 'idle';
              const Icon = agent.icon;
              const size = agent.id === 'OVERSEER' ? 52 : 40;

              return (
                <foreignObject
                  key={agent.id}
                  x={`${agent.x - size / 2}%`}
                  y={`${agent.y - size / 2}%`}
                  width={`${size}%`}
                  height={`${size}%`}
                  style={{ overflow: 'visible', pointerEvents: 'none' }}
                >
                  <div
                    onClick={() => handleAgentClick(agent.id)}
                    style={{ pointerEvents: 'auto' }}
                    className={`flex flex-col items-center justify-center w-full h-full cursor-pointer group`}
                  >
                    {/* Outer ring */}
                    <div
                      className={`relative w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-500 ${
                        selectedAgent === agent.id ? 'scale-110' : ''
                      }`}
                      style={{
                        background: isActive ? `${agent.color}12` : 'rgba(255,255,255,0.03)',
                        border: `1.5px solid ${isActive ? `${agent.color}40` : 'rgba(255,255,255,0.06)'}`,
                        boxShadow: isActive ? `0 0 30px ${agent.glowColor}, inset 0 0 20px ${agent.glowColor}` : 'none',
                      }}
                    >
                      {/* Pulse animation */}
                      {isActive && (
                        <div
                          className="absolute inset-0 rounded-full animate-ping opacity-20"
                          style={{ background: agent.color, animationDuration: '3s' }}
                        />
                      )}

                      <Icon
                        size={agent.id === 'OVERSEER' ? 24 : 20}
                        style={{ color: isActive ? agent.color : 'rgba(255,255,255,0.3)' }}
                        className="relative z-10"
                      />

                      {/* Status dot */}
                      <div
                        className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#02050A] ${
                          agent.status === 'active' || agent.status === 'thinking' ? 'bg-emerald-500' :
                          agent.status === 'streaming' ? 'bg-amber-500' :
                          agent.status === 'delegating' ? 'bg-purple-500' :
                          'bg-white/20'
                        }`}
                      >
                        {(agent.status === 'active' || agent.status === 'thinking') && (
                          <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-50" />
                        )}
                      </div>
                    </div>

                    {/* Label */}
                    <div className="mt-1.5 text-center">
                      <div className={`text-[9px] md:text-[10px] font-semibold tracking-wide ${
                        isActive ? 'text-white' : 'text-white/30'
                      }`}>
                        {agent.name}
                      </div>
                      {agent.status !== 'idle' && agent.task && (
                        <div className="text-[7px] md:text-[8px] text-white/30 font-mono max-w-[80px] md:max-w-[100px] truncate mx-auto">
                          {agent.task}
                        </div>
                      )}
                    </div>
                  </div>
                </foreignObject>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 flex items-center gap-4 text-[9px] font-mono text-white/30">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" /> Active
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500" /> Streaming
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-purple-500" /> Delegating
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-white/20" /> Idle
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-72 md:w-80 border-l border-white/5 bg-black/30 flex flex-col shrink-0 overflow-hidden">
          {/* Selected Agent Detail */}
          {selectedAgentData && (
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: `${selectedAgentData.color}15`,
                    border: `1px solid ${selectedAgentData.color}30`,
                    boxShadow: `0 0 20px ${selectedAgentData.glowColor}`,
                  }}
                >
                  <selectedAgentData.icon size={18} style={{ color: selectedAgentData.color }} />
                </div>
                <div>
                  <div className="text-sm font-semibold">{selectedAgentData.name}</div>
                  <div className="text-[9px] font-mono uppercase tracking-wider" style={{ color: selectedAgentData.color }}>
                    {selectedAgentData.category} • {STATUS_LABELS[selectedAgentData.status]}
                  </div>
                </div>
              </div>

              {selectedAgentData.task && (
                <div className="bg-white/5 rounded-lg px-3 py-2 text-[10px] text-white/50 font-mono">
                  <span className="text-white/30">Current Task:</span> {selectedAgentData.task}
                </div>
              )}

              {selectedAgentData.connections.length > 0 && (
                <div className="mt-2">
                  <div className="text-[8px] text-white/20 font-mono uppercase tracking-wider mb-1">Connected To</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedAgentData.connections.map(connId => {
                      const conn = agents.find(a => a.id === connId);
                      if (!conn) return null;
                      return (
                        <button
                          key={connId}
                          onClick={() => setSelectedAgent(connId)}
                          className="px-2 py-0.5 rounded text-[9px] font-mono transition-all cursor-pointer"
                          style={{
                            background: `${conn.color}10`,
                            border: `1px solid ${conn.color}20`,
                            color: conn.color,
                          }}
                        >
                          {conn.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Activity Feed */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="px-4 py-2 flex items-center justify-between border-b border-white/5">
              <div className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Live Activity</div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] text-white/20 font-mono">LIVE</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <ActivityFeed logs={activityLogs} />
              {activityLogs.length === 0 && (
                <div className="text-center text-white/15 text-[10px] py-8 font-mono">
                  Waiting for activity...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
