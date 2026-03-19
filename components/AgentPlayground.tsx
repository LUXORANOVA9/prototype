import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, Plus, Trash2, Link, Unlink, Save, Download, Upload,
  Zap, Brain, Code, Globe, MessageSquare, Image, Mic, Database,
  ArrowRight, ChevronDown, Grip, Settings, Copy, MoreHorizontal,
  Circle, CheckCircle, AlertCircle, GitBranch, Workflow, Terminal
} from 'lucide-react';

// --- Types ---
interface WorkflowNode {
  id: string;
  type: 'trigger' | 'agent' | 'condition' | 'action' | 'output';
  name: string;
  icon: React.ElementType;
  color: string;
  x: number;
  y: number;
  config: Record<string, string>;
  status: 'idle' | 'running' | 'success' | 'error';
}

interface Connection {
  id: string;
  from: string;
  to: string;
  fromPort: string;
  toPort: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  connections: Connection[];
  isActive: boolean;
}

// --- Node Templates ---
const NODE_TEMPLATES: Array<{
  type: WorkflowNode['type'];
  name: string;
  icon: React.ElementType;
  color: string;
  category: string;
}> = [
  { type: 'trigger', name: 'User Input', icon: MessageSquare, color: '#22c55e', category: 'Triggers' },
  { type: 'trigger', name: 'Schedule', icon: Zap, color: '#22c55e', category: 'Triggers' },
  { type: 'trigger', name: 'Webhook', icon: Globe, color: '#22c55e', category: 'Triggers' },
  { type: 'agent', name: 'Overseer', icon: Brain, color: '#f59e0b', category: 'Agents' },
  { type: 'agent', name: 'Developer', icon: Code, color: '#3b82f6', category: 'Agents' },
  { type: 'agent', name: 'Researcher', icon: Globe, color: '#14b8a6', category: 'Agents' },
  { type: 'agent', name: 'Visionary', icon: Image, color: '#a855f7', category: 'Agents' },
  { type: 'agent', name: 'Communicator', icon: Mic, color: '#f97316', category: 'Agents' },
  { type: 'condition', name: 'If/Else', icon: GitBranch, color: '#eab308', category: 'Logic' },
  { type: 'condition', name: 'Loop', icon: Workflow, color: '#eab308', category: 'Logic' },
  { type: 'action', name: 'API Call', icon: Terminal, color: '#6366f1', category: 'Actions' },
  { type: 'action', name: 'Database Query', icon: Database, color: '#6366f1', category: 'Actions' },
  { type: 'action', name: 'Transform Data', icon: Settings, color: '#6366f1', category: 'Actions' },
  { type: 'output', name: 'Send Response', icon: ArrowRight, color: '#ec4899', category: 'Output' },
  { type: 'output', name: 'Save to Core', icon: Database, color: '#ec4899', category: 'Output' },
  { type: 'output', name: 'Notify User', icon: MessageSquare, color: '#ec4899', category: 'Output' },
];

// --- Default Workflows ---
const DEFAULT_WORKFLOWS: Workflow[] = [
  {
    id: 'wf-1',
    name: 'Code Review Pipeline',
    description: 'Automated code review with Developer and Overseer agents',
    isActive: true,
    nodes: [
      { id: 'n1', type: 'trigger', name: 'User Input', icon: MessageSquare, color: '#22c55e', x: 10, y: 50, config: { input: 'code snippet' }, status: 'idle' },
      { id: 'n2', type: 'agent', name: 'Developer', icon: Code, color: '#3b82f6', x: 35, y: 30, config: { task: 'analyze code' }, status: 'idle' },
      { id: 'n3', type: 'condition', name: 'If/Else', icon: GitBranch, color: '#eab308', x: 35, y: 70, config: { condition: 'has errors?' }, status: 'idle' },
      { id: 'n4', type: 'agent', name: 'Overseer', icon: Brain, color: '#f59e0b', x: 60, y: 30, config: { task: 'review findings' }, status: 'idle' },
      { id: 'n5', type: 'output', name: 'Send Response', icon: ArrowRight, color: '#ec4899', x: 85, y: 50, config: { format: 'report' }, status: 'idle' },
    ],
    connections: [
      { id: 'c1', from: 'n1', to: 'n2', fromPort: 'out', toPort: 'in' },
      { id: 'c2', from: 'n1', to: 'n3', fromPort: 'out', toPort: 'in' },
      { id: 'c3', from: 'n2', to: 'n4', fromPort: 'out', toPort: 'in' },
      { id: 'c4', from: 'n3', to: 'n4', fromPort: 'true', toPort: 'in' },
      { id: 'c5', from: 'n4', to: 'n5', fromPort: 'out', toPort: 'in' },
    ],
  },
  {
    id: 'wf-2',
    name: 'Research & Summarize',
    description: 'Research a topic and generate a summary',
    isActive: false,
    nodes: [
      { id: 'n1', type: 'trigger', name: 'User Input', icon: MessageSquare, color: '#22c55e', x: 10, y: 50, config: { input: 'topic' }, status: 'idle' },
      { id: 'n2', type: 'agent', name: 'Researcher', icon: Globe, color: '#14b8a6', x: 40, y: 30, config: { task: 'web research' }, status: 'idle' },
      { id: 'n3', type: 'agent', name: 'Overseer', icon: Brain, color: '#f59e0b', x: 70, y: 50, config: { task: 'summarize' }, status: 'idle' },
      { id: 'n4', type: 'output', name: 'Send Response', icon: ArrowRight, color: '#ec4899', x: 90, y: 50, config: { format: 'markdown' }, status: 'idle' },
    ],
    connections: [
      { id: 'c1', from: 'n1', to: 'n2', fromPort: 'out', toPort: 'in' },
      { id: 'c2', from: 'n2', to: 'n3', fromPort: 'out', toPort: 'in' },
      { id: 'c3', from: 'n3', to: 'n4', fromPort: 'out', toPort: 'in' },
    ],
  },
];

// --- Workflow Node Component ---
function NodeCard({
  node,
  isSelected,
  onSelect,
  onDragStart,
  onDragEnd,
}: {
  node: WorkflowNode;
  isSelected: boolean;
  onSelect: () => void;
  onDragStart: (e: React.MouseEvent) => void;
  onDragEnd: (x: number, y: number) => void;
}) {
  const Icon = node.icon;
  const statusColors = {
    idle: 'bg-white/10',
    running: 'bg-amber-500 animate-pulse',
    success: 'bg-emerald-500',
    error: 'bg-red-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`absolute cursor-move select-none group`}
      style={{ left: `${node.x}%`, top: `${node.y}%`, transform: 'translate(-50%, -50%)' }}
      onMouseDown={onDragStart}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
    >
      <div
        className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
          isSelected ? 'ring-2 ring-amber-500/50' : ''
        }`}
        style={{
          background: `${node.color}08`,
          border: `1px solid ${isSelected ? `${node.color}60` : `${node.color}20`}`,
          boxShadow: isSelected ? `0 0 30px ${node.color}20` : 'none',
          minWidth: '100px',
        }}
      >
        {/* Status dot */}
        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#02050A] ${statusColors[node.status]}`} />

        {/* Icon */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: `${node.color}15`, border: `1px solid ${node.color}25` }}
        >
          <Icon size={18} style={{ color: node.color }} />
        </div>

        {/* Name */}
        <div className="text-[10px] font-semibold text-white/80 text-center">{node.name}</div>

        {/* Type badge */}
        <div className="text-[7px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{ background: `${node.color}15`, color: node.color }}>
          {node.type}
        </div>

        {/* Config preview */}
        {Object.keys(node.config).length > 0 && (
          <div className="text-[8px] text-white/30 font-mono max-w-[90px] truncate">
            {Object.values(node.config)[0]}
          </div>
        )}

        {/* Connection ports */}
        <div className="absolute -left-2 top-1/2 w-4 h-4 rounded-full bg-white/10 border border-white/20 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute -right-2 top-1/2 w-4 h-4 rounded-full bg-white/10 border border-white/20 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </motion.div>
  );
}

// --- Connection Line ---
function ConnectionLine({ from, to, nodes }: { from: string; to: string; nodes: WorkflowNode[] }) {
  const fromNode = nodes.find(n => n.id === from);
  const toNode = nodes.find(n => n.id === to);
  if (!fromNode || !toNode) return null;

  const x1 = fromNode.x;
  const y1 = fromNode.y;
  const x2 = toNode.x;
  const y2 = toNode.y;

  const midX = (x1 + x2) / 2;

  return (
    <path
      d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
      fill="none"
      stroke="rgba(255,255,255,0.1)"
      strokeWidth="0.3"
      strokeDasharray="1 1"
    />
  );
}

// --- Main Playground ---
export default function AgentPlayground() {
  const [workflows, setWorkflows] = useState<Workflow[]>(DEFAULT_WORKFLOWS);
  const [activeWorkflow, setActiveWorkflow] = useState<Workflow>(DEFAULT_WORKFLOWS[0]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [dragNode, setDragNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Run simulation
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setActiveWorkflow(prev => {
        const updated = { ...prev, nodes: prev.nodes.map(n => ({ ...n })) };
        const randomIdx = Math.floor(Math.random() * updated.nodes.length);
        const statuses: WorkflowNode['status'][] = ['idle', 'running', 'success', 'error'];
        const weights = [0.3, 0.3, 0.3, 0.1];
        const rand = Math.random();
        let cumulative = 0;
        let statusIdx = 0;
        for (let i = 0; i < weights.length; i++) {
          cumulative += weights[i];
          if (rand < cumulative) { statusIdx = i; break; }
        }
        updated.nodes[randomIdx].status = statuses[statusIdx];
        return updated;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isRunning]);

  const handleNodeDragStart = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setDragNode(nodeId);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const node = activeWorkflow.nodes.find(n => n.id === nodeId);
      if (node) {
        setDragOffset({
          x: e.clientX - (rect.left + (node.x / 100) * rect.width),
          y: e.clientY - (rect.top + (node.y / 100) * rect.height),
        });
      }
    }
  }, [activeWorkflow]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragNode || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - dragOffset.x - rect.left) / rect.width) * 100;
    const y = ((e.clientY - dragOffset.y - rect.top) / rect.height) * 100;

    setActiveWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.map(n =>
        n.id === dragNode ? { ...n, x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) } : n
      ),
    }));
  }, [dragNode, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setDragNode(null);
  }, []);

  const addNode = (template: typeof NODE_TEMPLATES[0]) => {
    const newNode: WorkflowNode = {
      id: `n-${Date.now()}`,
      type: template.type,
      name: template.name,
      icon: template.icon,
      color: template.color,
      x: 50,
      y: 50,
      config: {},
      status: 'idle',
    };
    setActiveWorkflow(prev => ({ ...prev, nodes: [...prev.nodes, newNode] }));
    setShowPalette(false);
    setSelectedNode(newNode.id);
  };

  const deleteSelectedNode = () => {
    if (!selectedNode) return;
    setActiveWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.filter(n => n.id !== selectedNode),
      connections: prev.connections.filter(c => c.from !== selectedNode && c.to !== selectedNode),
    }));
    setSelectedNode(null);
  };

  const duplicateSelectedNode = () => {
    if (!selectedNode) return;
    const node = activeWorkflow.nodes.find(n => n.id === selectedNode);
    if (!node) return;
    const newNode: WorkflowNode = { ...node, id: `n-${Date.now()}`, x: node.x + 5, y: node.y + 5, status: 'idle' };
    setActiveWorkflow(prev => ({ ...prev, nodes: [...prev.nodes, newNode] }));
    setSelectedNode(newNode.id);
  };

  const selectedNodeData = activeWorkflow.nodes.find(n => n.id === selectedNode);

  // Grouped templates
  const groupedTemplates = NODE_TEMPLATES.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {} as Record<string, typeof NODE_TEMPLATES>);

  return (
    <div className="flex flex-col h-full bg-[#02050A] text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Workflow size={16} className="text-indigo-500" />
          </div>
          <div>
            <div className="text-sm font-semibold">Agent Playground</div>
            <div className="text-[10px] text-white/30 font-mono">VISUAL WORKFLOW BUILDER</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Workflow selector */}
          <select
            value={activeWorkflow.id}
            onChange={e => setActiveWorkflow(workflows.find(w => w.id === e.target.value) || workflows[0])}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/60 focus:outline-none focus:border-amber-500/30 cursor-pointer"
          >
            {workflows.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>

          <button
            onClick={() => setShowPalette(!showPalette)}
            className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 transition-all cursor-pointer"
            title="Add Node"
          >
            <Plus size={14} />
          </button>

          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              isRunning ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-white/40 hover:bg-white/10'
            }`}
          >
            {isRunning ? <Pause size={14} /> : <Play size={14} />}
          </button>

          {selectedNode && (
            <>
              <button onClick={duplicateSelectedNode} className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 transition-all cursor-pointer">
                <Copy size={14} />
              </button>
              <button onClick={deleteSelectedNode} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all cursor-pointer">
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Node Palette (slide out) */}
        <AnimatePresence>
          {showPalette && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 220, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="h-full border-r border-white/5 bg-black/50 overflow-y-auto shrink-0"
            >
              <div className="p-3">
                <div className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-3">Node Palette</div>
                {Object.entries(groupedTemplates).map(([category, templates]) => (
                  <div key={category} className="mb-4">
                    <div className="text-[9px] font-bold text-white/20 uppercase tracking-wider mb-2">{category}</div>
                    <div className="space-y-1">
                      {templates.map((t, i) => {
                        const Icon = t.icon;
                        return (
                          <button
                            key={i}
                            onClick={() => addNode(t)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-all cursor-pointer text-left"
                          >
                            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: `${t.color}15` }}>
                              <Icon size={12} style={{ color: t.color }} />
                            </div>
                            <span className="text-[10px] text-white/60">{t.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 relative overflow-hidden"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={() => setSelectedNode(null)}
        >
          {/* Grid */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }} />

          {/* Connection lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            {activeWorkflow.connections.map(conn => (
              <ConnectionLine key={conn.id} from={conn.from} to={conn.to} nodes={activeWorkflow.nodes} />
            ))}
          </svg>

          {/* Nodes */}
          {activeWorkflow.nodes.map(node => (
            <NodeCard
              key={node.id}
              node={node}
              isSelected={selectedNode === node.id}
              onSelect={() => setSelectedNode(node.id)}
              onDragStart={(e) => handleNodeDragStart(node.id, e)}
              onDragEnd={() => {}}
            />
          ))}

          {/* Empty state */}
          {activeWorkflow.nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white/20">
                <Workflow size={32} className="mx-auto mb-3 opacity-30" />
                <div className="text-sm mb-1">Empty Workflow</div>
                <div className="text-[10px]">Click + to add nodes</div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel — Node Details */}
        {selectedNodeData && (
          <div className="w-72 border-l border-white/5 bg-black/30 overflow-y-auto shrink-0">
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${selectedNodeData.color}15`, border: `1px solid ${selectedNodeData.color}25` }}
                >
                  <selectedNodeData.icon size={18} style={{ color: selectedNodeData.color }} />
                </div>
                <div>
                  <div className="text-sm font-semibold">{selectedNodeData.name}</div>
                  <div className="text-[9px] font-mono uppercase" style={{ color: selectedNodeData.color }}>{selectedNodeData.type}</div>
                </div>
              </div>

              {/* Config */}
              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-mono text-white/30 uppercase tracking-wider">Node Name</label>
                  <input
                    type="text"
                    value={selectedNodeData.name}
                    onChange={e => setActiveWorkflow(prev => ({
                      ...prev,
                      nodes: prev.nodes.map(n => n.id === selectedNode ? { ...n, name: e.target.value } : n),
                    }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white mt-1 focus:outline-none focus:border-amber-500/30"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-mono text-white/30 uppercase tracking-wider">Configuration</label>
                  {Object.entries(selectedNodeData.config).map(([key, value]) => (
                    <div key={key} className="flex gap-2 mt-1">
                      <input
                        type="text"
                        value={key}
                        className="w-1/3 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-[10px] text-white/40 focus:outline-none"
                        readOnly
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={e => setActiveWorkflow(prev => ({
                          ...prev,
                          nodes: prev.nodes.map(n =>
                            n.id === selectedNode ? { ...n, config: { ...n.config, [key]: e.target.value } } : n
                          ),
                        }))}
                        className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-[10px] text-white focus:outline-none focus:border-amber-500/30"
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => setActiveWorkflow(prev => ({
                      ...prev,
                      nodes: prev.nodes.map(n =>
                        n.id === selectedNode ? { ...n, config: { ...n.config, [`param_${Date.now()}`]: '' } } : n
                      ),
                    }))}
                    className="w-full mt-2 py-1.5 text-[9px] text-white/30 hover:text-white/50 border border-dashed border-white/10 rounded-lg transition-all cursor-pointer"
                  >
                    + Add Parameter
                  </button>
                </div>

                {/* Connections */}
                <div>
                  <label className="text-[9px] font-mono text-white/30 uppercase tracking-wider">Connections</label>
                  <div className="mt-1 space-y-1">
                    {activeWorkflow.connections
                      .filter(c => c.from === selectedNode || c.to === selectedNode)
                      .map(c => {
                        const otherNode = activeWorkflow.nodes.find(n => n.id === (c.from === selectedNode ? c.to : c.from));
                        return (
                          <div key={c.id} className="flex items-center gap-2 text-[10px] text-white/40">
                            <ArrowRight size={10} className={c.from === selectedNode ? '' : 'rotate-180'} />
                            <span>{otherNode?.name || 'Unknown'}</span>
                            <button
                              onClick={() => setActiveWorkflow(prev => ({
                                ...prev,
                                connections: prev.connections.filter(cc => cc.id !== c.id),
                              }))}
                              className="ml-auto text-red-400/50 hover:text-red-400 cursor-pointer"
                            >
                              <Unlink size={10} />
                            </button>
                          </div>
                        );
                      })}
                    {activeWorkflow.connections.filter(c => c.from === selectedNode || c.to === selectedNode).length === 0 && (
                      <div className="text-[9px] text-white/15">No connections</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 bg-black/40 text-[9px] font-mono text-white/20">
        <div className="flex items-center gap-4">
          <span>{activeWorkflow.nodes.length} nodes</span>
          <span>{activeWorkflow.connections.length} connections</span>
          <span className={isRunning ? 'text-emerald-500' : ''}>{isRunning ? 'Running' : 'Stopped'}</span>
        </div>
        <div>
          {activeWorkflow.name}
        </div>
      </div>
    </div>
  );
}
