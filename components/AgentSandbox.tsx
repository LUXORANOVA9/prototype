import React, { useEffect, useState, useRef } from 'react';
import { 
  Cpu, 
  Zap, 
  Activity, 
  Terminal, 
  Brain, 
  Workflow, 
  Loader2, 
  ShieldCheck, 
  Database,
  Network,
  Layers,
  ChevronRight,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AgentThought {
  id: string;
  agent: string;
  thought: string;
  timestamp: number;
  type: 'reasoning' | 'action' | 'observation' | 'error';
}

interface AgentStatus {
  name: string;
  status: 'idle' | 'thinking' | 'executing' | 'error';
  cpu: number;
  memory: number;
  lastAction: string;
}

export const AgentSandbox: React.FC = () => {
  const [thoughts, setThoughts] = useState<AgentThought[]>([]);
  const [agents, setAgents] = useState<Record<string, AgentStatus>>({
    'Overseer': { name: 'Overseer', status: 'idle', cpu: 0, memory: 0, lastAction: 'Waiting for directive' },
    'Developer': { name: 'Developer', status: 'idle', cpu: 0, memory: 0, lastAction: 'Standby' },
    'Researcher': { name: 'Researcher', status: 'idle', cpu: 0, memory: 0, lastAction: 'Standby' },
    'Antigravity': { name: 'Antigravity', status: 'idle', cpu: 0, memory: 0, lastAction: 'Standby' },
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleTelemetry = (e: any) => {
      const event = e.detail;
      
      // Update agent status based on telemetry
      if (event.type === 'action') {
        const agentName = event.metadata?.assignedAgent || event.metadata?.agent || 'Overseer';
        setAgents(prev => ({
          ...prev,
          [agentName]: {
            ...(prev[agentName] || { name: agentName, status: 'idle', cpu: 0, memory: 0, lastAction: '' }),
            status: event.content.includes('Executing') ? 'executing' : 'idle',
            lastAction: event.content,
            cpu: Math.floor(Math.random() * 30) + 10,
            memory: Math.floor(Math.random() * 50) + 20
          }
        }));

        // Add to thoughts stream
        const newThought: AgentThought = {
          id: `thought-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          agent: agentName,
          thought: event.content,
          timestamp: Date.now(),
          type: event.content.includes('Executing') ? 'action' : 'observation'
        };
        setThoughts(prev => [newThought, ...prev].slice(0, 50));
      }
    };

    window.addEventListener('luxor9_telemetry_event', handleTelemetry);
    return () => window.removeEventListener('luxor9_telemetry_event', handleTelemetry);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [thoughts]);

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-white/10 rounded-xl overflow-hidden shadow-2xl font-mono">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-cyan-500/10 rounded border border-cyan-500/20 text-cyan-500">
            <Bot size={14} />
          </div>
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-400">Agentic Sandbox</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Activity size={10} className="text-emerald-500 animate-pulse" />
            <span className="text-[8px] text-emerald-500 font-bold uppercase">System Nominal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers size={10} className="text-cyan-500" />
            <span className="text-[8px] text-cyan-500 font-bold uppercase">L4 Active</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Agent Roster */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 border-b border-white/5">
          {Object.values(agents).map(agent => (
            <div key={agent.name} className={`p-2 rounded-lg border transition-all duration-500 ${agent.status !== 'idle' ? 'bg-cyan-500/5 border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]' : 'bg-white/5 border-white/5'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[9px] font-bold uppercase ${agent.status !== 'idle' ? 'text-cyan-400' : 'text-zinc-500'}`}>{agent.name}</span>
                {agent.status !== 'idle' && <Loader2 size={8} className="animate-spin text-cyan-400" />}
              </div>
              <div className="flex items-center justify-between text-[8px] text-zinc-600">
                <div className="flex items-center gap-1">
                  <Cpu size={8} /> {agent.cpu}%
                </div>
                <div className="flex items-center gap-1">
                  <Database size={8} /> {agent.memory}MB
                </div>
              </div>
              <div className="mt-1.5 h-0.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${agent.cpu}%` }}
                  className={`h-full ${agent.status !== 'idle' ? 'bg-cyan-500' : 'bg-zinc-700'}`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Thought Stream */}
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar" ref={scrollRef}>
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {thoughts.map((thought) => (
                <motion.div
                  key={thought.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex gap-3 group"
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${
                      thought.type === 'action' ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]' : 
                      thought.type === 'error' ? 'bg-red-500' : 'bg-zinc-700'
                    }`} />
                    <div className="w-px flex-1 bg-white/5 group-last:hidden" />
                  </div>
                  <div className="flex-1 min-w-0 pb-3 border-b border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-bold text-cyan-500/80 uppercase tracking-wider">{thought.agent}</span>
                      <span className="text-[8px] text-zinc-600">{new Date(thought.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>
                    <p className="text-[10px] text-zinc-300 leading-relaxed break-words">
                      <span className="text-zinc-600 mr-1">❯</span>
                      {thought.thought}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {thoughts.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full py-10 opacity-20">
                <Brain size={32} className="mb-2" />
                <span className="text-[10px] uppercase tracking-[0.2em]">Neural Stream Idle</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Metrics */}
      <div className="px-4 py-2 bg-white/5 border-t border-white/10 flex items-center justify-between text-[8px] text-zinc-500 uppercase tracking-widest">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Network size={10} /> Latency: 42ms
          </div>
          <div className="flex items-center gap-1">
            <ShieldCheck size={10} /> Integrity: 100%
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Terminal size={10} /> IPC_CHANNEL: ACTIVE
        </div>
      </div>
    </div>
  );
};
