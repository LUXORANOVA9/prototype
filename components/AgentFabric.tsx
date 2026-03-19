import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Code, Sparkles, Film, Globe, BarChart3, Mic, MapPin,
  Users, Network, Zap, Server, Activity, Radio, ArrowRight,
  Circle, Check, X, AlertTriangle, Clock, Cpu, Shield,
  Layers, Target, Settings, RefreshCw, Play, Pause, Send,
  ChevronRight, Eye, GitBranch, Workflow, Database, Maximize2, Minimize2
} from 'lucide-react';
import AgentFabric, { AgentDefinition, AgentInstance, FabricTask, FabricMessage, FabricEvent } from '../services/agentFabric';

// --- Icon Map ---
const ICON_MAP: Record<string, React.ElementType> = {
  Brain, Code, Sparkles, Film, Globe, BarChart3, Mic, MapPin,
  Users, Network, Zap, Server,
};

// --- Status Colors ---
const STATUS_COLORS: Record<string, { bg: string; text: string; glow: string }> = {
  idle: { bg: 'bg-white/5', text: 'text-white/40', glow: '' },
  busy: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', glow: 'shadow-[0_0_15px_rgba(34,197,94,0.2)]' },
  initializing: { bg: 'bg-amber-500/10', text: 'text-amber-500', glow: '' },
  error: { bg: 'bg-red-500/10', text: 'text-red-500', glow: '' },
  offline: { bg: 'bg-white/5', text: 'text-white/20', glow: '' },
};

// --- Agent Node ---
function AgentNode({ definition, instance, isSelected, onClick, onSendTask }: {
  definition: AgentDefinition;
  instance: AgentInstance;
  isSelected: boolean;
  onClick: () => void;
  onSendTask: () => void;
}) {
  const Icon = ICON_MAP[definition.icon] || Circle;
  const statusStyle = STATUS_COLORS[instance.status] || STATUS_COLORS.idle;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative group cursor-pointer ${isSelected ? 'z-10' : 'z-0'}`}
      onClick={onClick}
    >
      <div className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
        isSelected
          ? `border-[${definition.color}40] bg-[${definition.color}08]`
          : 'border-white/5 bg-white/[0.02] hover:border-white/10'
      }`} style={isSelected ? { borderColor: `${definition.color}40`, background: `${definition.color}08` } : {}}>
        {/* Icon */}
        <div className="relative">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${statusStyle.glow}`}
            style={{
              background: `${definition.color}12`,
              border: `1.5px solid ${instance.status === 'busy' ? `${definition.color}50` : `${definition.color}20`}`,
              boxShadow: instance.status === 'busy' ? `0 0 20px ${definition.color}20` : 'none',
            }}
          >
            <Icon size={20} style={{ color: definition.color }} />
          </div>

          {/* Status dot */}
          <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#02050A] ${
            instance.status === 'busy' ? 'bg-emerald-500' :
            instance.status === 'idle' ? 'bg-white/30' :
            instance.status === 'error' ? 'bg-red-500' :
            instance.status === 'initializing' ? 'bg-amber-500 animate-pulse' :
            'bg-white/10'
          }`}>
            {instance.status === 'busy' && (
              <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-40" />
            )}
          </div>
        </div>

        {/* Name */}
        <div className="text-[10px] font-semibold text-white/80 text-center">{definition.name}</div>

        {/* Status */}
        <div className={`text-[8px] font-mono uppercase tracking-wider ${statusStyle.text}`}>
          {instance.status}
        </div>

        {/* Task count */}
        {instance.tasksCompleted > 0 && (
          <div className="text-[8px] text-white/20 font-mono">{instance.tasksCompleted} tasks</div>
        )}

        {/* Quick action */}
        {instance.status === 'idle' && (
          <button
            onClick={(e) => { e.stopPropagation(); onSendTask(); }}
            className="opacity-0 group-hover:opacity-100 absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[8px] font-mono transition-all cursor-pointer whitespace-nowrap"
          >
            Send Task
          </button>
        )}
      </div>
    </motion.div>
  );
}

// --- Event Feed ---
function EventFeed({ events }: { events: FabricEvent[] }) {
  const typeColors: Record<string, string> = {
    task_created: '#3b82f6',
    task_assigned: '#f59e0b',
    task_completed: '#22c55e',
    task_failed: '#ef4444',
    delegation: '#a855f7',
    message_sent: '#6366f1',
    agent_registered: '#22c55e',
    agent_status_changed: '#eab308',
    health_alert: '#ef4444',
  };

  return (
    <div className="space-y-1.5">
      <AnimatePresence mode="popLayout">
        {events.slice(0, 20).map(event => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2 text-[10px] leading-relaxed"
          >
            <span className="text-white/15 font-mono shrink-0 w-14">
              {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <div className="w-1.5 h-1.5 rounded-full mt-1 shrink-0" style={{ background: typeColors[event.type] || '#666' }} />
            <span className="text-white/40 font-mono shrink-0">{event.source}</span>
            <span className="text-white/30">{event.type.replace(/_/g, ' ')}</span>
          </motion.div>
        ))}
      </AnimatePresence>
      {events.length === 0 && (
        <div className="text-center text-white/10 text-[10px] py-4">No events yet</div>
      )}
    </div>
  );
}

// --- Main Dashboard ---
export default function AgentFabricDashboard() {
  const fabric = AgentFabric.getInstance();
  const [definitions] = useState<AgentDefinition[]>(fabric.getDefinitions());
  const [instances, setInstances] = useState<AgentInstance[]>(fabric.getInstances());
  const [tasks, setTasks] = useState<FabricTask[]>([]);
  const [events, setEvents] = useState<FabricEvent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>('OVERSEER');
  const [isSimulating, setIsSimulating] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskTarget, setTaskTarget] = useState('');

  // Refresh state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setInstances(fabric.getInstances());
      setTasks(fabric.getTasks({ limit: 20 }));
      setEvents(fabric.getEvents({ limit: 30 }));
    }, 500);
    return () => clearInterval(interval);
  }, [fabric]);

  // Simulation engine
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      // Randomly create tasks
      if (Math.random() > 0.6) {
        const capabilities = ['coding', 'planning', 'web_search', 'image_generation', 'data_analysis', 'coordination'];
        const cap = capabilities[Math.floor(Math.random() * capabilities.length)];
        const taskTitles: Record<string, string[]> = {
          coding: ['Write API endpoint', 'Fix authentication bug', 'Add unit tests', 'Refactor database layer'],
          planning: ['Create project roadmap', 'Sprint planning session', 'Risk assessment'],
          web_search: ['Research competitors', 'Find API documentation', 'Verify claims'],
          image_generation: ['Create hero banner', 'Design logo concept', 'Generate product mockup'],
          data_analysis: ['Analyze user metrics', 'Process sales data', 'Create dashboard'],
          coordination: ['Review all agent status', 'Delegate subtask', 'Supervise execution'],
        };
        const titles = taskTitles[cap] || ['New task'];
        const title = titles[Math.floor(Math.random() * titles.length)];

        fabric.createTask({
          title,
          description: `Auto-generated task for ${cap}`,
          priority: Math.random() > 0.7 ? 'high' : 'normal',
          requiredCapabilities: [cap],
          input: { request: title },
        });
      }

      // Randomly complete tasks
      const assignedTasks = fabric.getTasks({ status: 'assigned' });
      if (assignedTasks.length > 0 && Math.random() > 0.5) {
        const task = assignedTasks[Math.floor(Math.random() * assignedTasks.length)];
        if (Math.random() > 0.1) {
          fabric.completeTask(task.id, { result: 'Task completed successfully' });
        } else {
          fabric.failTask(task.id, 'Simulated failure');
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isSimulating, fabric]);

  // Listen to all events
  useEffect(() => {
    const unsub = fabric.on('*', () => {});
    return unsub;
  }, [fabric]);

  const handleSendTask = (agentId: string) => {
    setTaskTarget(agentId);
    setShowTaskModal(true);
  };

  const submitTask = () => {
    if (!taskTitle.trim()) return;
    const def = fabric.getDefinition(taskTarget);
    fabric.createTask({
      title: taskTitle.trim(),
      description: `Manual task assigned to ${def?.name}`,
      priority: 'normal',
      requiredCapabilities: def?.capabilities.slice(0, 2) || [],
      input: { request: taskTitle.trim() },
    });
    setTaskTitle('');
    setShowTaskModal(false);
  };

  const stats = fabric.getStats();
  const selectedDef = definitions.find(d => d.id === selectedAgent);
  const selectedInstance = instances.find(i => i.definitionId === selectedAgent);

  // Category groups
  const agentGroups = useMemo(() => {
    const groups: Record<string, AgentDefinition[]> = {};
    definitions.forEach(def => {
      if (!groups[def.category]) groups[def.category] = [];
      groups[def.category].push(def);
    });
    return groups;
  }, [definitions]);

  return (
    <div className={`flex flex-col h-full bg-[#02050A] text-white overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
            <Workflow size={16} className="text-black" />
          </div>
          <div>
            <div className="text-sm font-semibold">Agent Fabric</div>
            <div className="text-[10px] text-white/30 font-mono">CENTRAL NERVOUS SYSTEM</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Stats */}
          <div className="hidden md:flex items-center gap-4 text-[9px] font-mono text-white/30">
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {stats.busyAgents} busy
            </span>
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-white/20" /> {stats.idleAgents} idle
            </span>
            <span>{stats.completedTasks} tasks done</span>
          </div>

          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              isSimulating ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-white/40'
            }`}
          >
            {isSimulating ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 transition-all cursor-pointer">
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Agent Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Overall Stats */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {[
              { label: 'Agents', value: stats.totalAgents, color: '#f59e0b' },
              { label: 'Active', value: stats.activeAgents, color: '#22c55e' },
              { label: 'Tasks', value: stats.totalTasks, color: '#3b82f6' },
              { label: 'Messages', value: stats.totalMessages, color: '#a855f7' },
            ].map(stat => (
              <div key={stat.label} className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center">
                <div className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
                <div className="text-[8px] text-white/25 font-mono uppercase">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Agent Groups */}
          {Object.entries(agentGroups).map(([category, agents]) => (
            <div key={category} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-1 rounded-full bg-white/30" />
                <span className="text-[9px] font-mono text-white/30 uppercase tracking-wider">{category}</span>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {agents.map(def => {
                  const inst = instances.find(i => i.definitionId === def.id);
                  if (!inst) return null;
                  return (
                    <AgentNode
                      key={def.id}
                      definition={def}
                      instance={inst}
                      isSelected={selectedAgent === def.id}
                      onClick={() => setSelectedAgent(def.id)}
                      onSendTask={() => handleSendTask(def.id)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right Panel */}
        <div className="w-80 border-l border-white/5 bg-black/30 flex flex-col shrink-0 overflow-hidden">
          {/* Selected Agent Detail */}
          {selectedDef && selectedInstance && (
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${selectedDef.color}15`, border: `1px solid ${selectedDef.color}25` }}
                >
                  {(ICON_MAP[selectedDef.icon] || Circle) && React.createElement(ICON_MAP[selectedDef.icon] || Circle, { size: 18, style: { color: selectedDef.color } })}
                </div>
                <div>
                  <div className="text-sm font-semibold">{selectedDef.name}</div>
                  <div className="text-[9px] font-mono uppercase" style={{ color: selectedDef.color }}>
                    {selectedDef.category} · {selectedInstance.status}
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-white/30 leading-relaxed mb-3">{selectedDef.description}</p>

              {/* Capabilities */}
              <div className="mb-3">
                <div className="text-[8px] text-white/20 font-mono uppercase tracking-wider mb-1">Capabilities</div>
                <div className="flex flex-wrap gap-1">
                  {selectedDef.capabilities.map(cap => (
                    <span key={cap} className="px-1.5 py-0.5 rounded bg-white/5 text-[8px] text-white/30 font-mono">{cap}</span>
                  ))}
                </div>
              </div>

              {/* Tools */}
              <div className="mb-3">
                <div className="text-[8px] text-white/20 font-mono uppercase tracking-wider mb-1">Tools ({selectedDef.tools.length})</div>
                <div className="space-y-1">
                  {selectedDef.tools.map(tool => (
                    <div key={tool.id} className="flex items-center gap-2 text-[9px] text-white/40">
                      <Wrench size={9} className="text-white/20" />
                      {tool.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2">
                  <div className="text-sm font-bold text-emerald-500">{selectedInstance.tasksCompleted}</div>
                  <div className="text-[7px] text-white/20 font-mono">Done</div>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2">
                  <div className="text-sm font-bold text-red-400">{selectedInstance.tasksFailed}</div>
                  <div className="text-[7px] text-white/20 font-mono">Failed</div>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2">
                  <div className="text-sm font-bold text-white/50">{Math.round(selectedInstance.averageLatency)}ms</div>
                  <div className="text-[7px] text-white/20 font-mono">Avg</div>
                </div>
              </div>

              {/* Dependencies */}
              {selectedDef.dependencies.length > 0 && (
                <div className="mt-3">
                  <div className="text-[8px] text-white/20 font-mono uppercase tracking-wider mb-1">Depends On</div>
                  <div className="flex gap-1">
                    {selectedDef.dependencies.map(depId => {
                      const depDef = definitions.find(d => d.id === depId);
                      return depDef ? (
                        <button
                          key={depId}
                          onClick={() => setSelectedAgent(depId)}
                          className="px-2 py-0.5 rounded bg-white/5 text-[8px] text-white/40 font-mono hover:bg-white/10 cursor-pointer"
                        >
                          {depDef.name}
                        </button>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Event Feed */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="px-4 py-2 flex items-center justify-between border-b border-white/5">
              <div className="text-[9px] font-mono text-white/30 uppercase tracking-wider">Fabric Events</div>
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${isSimulating ? 'bg-emerald-500 animate-pulse' : 'bg-white/20'}`} />
                <span className="text-[8px] text-white/20 font-mono">{isSimulating ? 'LIVE' : 'PAUSED'}</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <EventFeed events={events} />
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="border-t border-white/5 p-3 max-h-48 overflow-y-auto">
            <div className="text-[9px] font-mono text-white/30 uppercase tracking-wider mb-2">Recent Tasks</div>
            <div className="space-y-1.5">
              {tasks.slice(0, 8).map(task => (
                <div key={task.id} className="flex items-center gap-2 text-[10px]">
                  <div className={`w-2 h-2 rounded-full ${
                    task.status === 'completed' ? 'bg-emerald-500' :
                    task.status === 'failed' ? 'bg-red-500' :
                    task.status === 'assigned' || task.status === 'running' ? 'bg-amber-500 animate-pulse' :
                    'bg-white/20'
                  }`} />
                  <span className="text-white/50 truncate flex-1">{task.title}</span>
                  <span className="text-white/20 font-mono shrink-0">{task.assignedTo?.split('-')[0] || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Task Modal */}
      <AnimatePresence>
        {showTaskModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowTaskModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-2xl p-6"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-1">Send Task</h3>
              <p className="text-[10px] text-white/30 mb-4">To: {definitions.find(d => d.id === taskTarget)?.name}</p>
              <input
                type="text"
                value={taskTitle}
                onChange={e => setTaskTitle(e.target.value)}
                placeholder="Task description..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/30 mb-4"
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') submitTask(); }}
              />
              <div className="flex gap-2">
                <button onClick={() => setShowTaskModal(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 text-white/40 text-sm cursor-pointer">Cancel</button>
                <button onClick={submitTask} disabled={!taskTitle.trim()} className="flex-1 py-2.5 rounded-xl bg-amber-500 text-black text-sm font-semibold disabled:opacity-30 cursor-pointer flex items-center justify-center gap-2">
                  <Send size={14} /> Send
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 bg-black/40 text-[9px] font-mono text-white/20">
        <div className="flex items-center gap-4">
          <span>{stats.totalAgents} agents registered</span>
          <span>{stats.queuedTasks} queued</span>
          <span>{stats.totalEvents} events</span>
        </div>
        <div className="flex items-center gap-1">
          <Workflow size={9} className="text-amber-500/50" />
          <span>Agent Fabric v1.0</span>
        </div>
      </div>
    </div>
  );
}
