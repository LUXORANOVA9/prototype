/**
 * Agent Fabric — Core Service
 * Central nervous system for inter-agent communication, routing, and state.
 * 
 * Architecture:
 * ┌─────────────────────────────────────────────┐
 * │              AGENT FABRIC                    │
 * │                                              │
 * │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
 * │  │ Registry │  │ Message  │  │  State    │  │
 * │  │ (Agents) │  │   Bus    │  │  Store    │  │
 * │  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
 * │       │              │              │        │
 * │  ┌────┴──────────────┴──────────────┴────┐  │
 * │  │           Fabric Core                  │  │
 * │  │  - Lifecycle Management                │  │
 * │  │  - Task Routing                        │  │
 * │  │  - Health Monitoring                   │  │
 * │  │  - Event System                        │  │
 * │  └────────────────────────────────────────┘  │
 * └─────────────────────────────────────────────┘
 */

import { v4 as uuidv4 } from 'uuid';

// --- Types ---

export interface AgentDefinition {
  id: string;
  name: string;
  category: 'executive' | 'specialist' | 'executor' | 'operational' | 'manager';
  capabilities: string[];
  description: string;
  icon: string;
  color: string;
  maxConcurrentTasks: number;
  priority: number; // 1-10, higher = more priority
  dependencies: string[]; // agent IDs this agent depends on
  tools: AgentTool[];
}

export interface AgentTool {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
}

export interface AgentInstance {
  definitionId: string;
  instanceId: string;
  status: 'initializing' | 'idle' | 'busy' | 'error' | 'offline';
  currentTaskId?: string;
  tasksCompleted: number;
  tasksFailed: number;
  averageLatency: number; // ms
  lastHeartbeat: number;
  startedAt: number;
  metadata: Record<string, any>;
}

export interface FabricMessage {
  id: string;
  from: string; // agent instance ID or 'user' or 'system'
  to: string | string[]; // agent instance ID(s) or 'broadcast'
  type: 'task' | 'response' | 'event' | 'state_update' | 'heartbeat' | 'delegation';
  payload: any;
  timestamp: number;
  correlationId?: string; // for request/response pairing
  priority: 'low' | 'normal' | 'high' | 'critical';
  ttl?: number; // time to live in ms
}

export interface FabricTask {
  id: string;
  title: string;
  description: string;
  assignedTo?: string; // agent instance ID
  status: 'queued' | 'routing' | 'assigned' | 'running' | 'completed' | 'failed' | 'delegated';
  priority: 'low' | 'normal' | 'high' | 'critical';
  requiredCapabilities: string[];
  input: any;
  output?: any;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  delegationChain: string[]; // track which agents handled this
  parentTaskId?: string;
  subtasks: string[];
}

export interface SharedState {
  key: string;
  value: any;
  owner: string; // agent that last wrote
  readers: string[]; // agents that have read access
  updatedAt: number;
  version: number;
}

export interface FabricEvent {
  id: string;
  type: 'agent_registered' | 'agent_deregistered' | 'agent_status_changed' | 'task_created' | 'task_assigned' | 'task_completed' | 'task_failed' | 'message_sent' | 'delegation' | 'health_alert';
  source: string;
  data: any;
  timestamp: number;
}

// --- Agent Definitions (the 12 agents) ---

const AGENT_DEFINITIONS: AgentDefinition[] = [
  {
    id: 'OVERSEER', name: 'Overseer', category: 'executive',
    capabilities: ['coordination', 'planning', 'delegation', 'strategy', 'supervision'],
    description: 'Executive agent that coordinates all other agents. Handles strategic planning and task delegation.',
    icon: 'Brain', color: '#f59e0b', maxConcurrentTasks: 10, priority: 10, dependencies: [],
    tools: [
      { id: 'delegate', name: 'Delegate Task', description: 'Assign a task to another agent', parameters: { targetAgent: { type: 'string', description: 'Agent to delegate to', required: true }, task: { type: 'string', description: 'Task description', required: true } } },
      { id: 'plan', name: 'Create Plan', description: 'Create a multi-step execution plan', parameters: { goal: { type: 'string', description: 'Goal to achieve', required: true } } },
      { id: 'supervise', name: 'Supervise', description: 'Monitor and review agent work', parameters: { agentId: { type: 'string', description: 'Agent to supervise' } } },
    ],
  },
  {
    id: 'DEVELOPER', name: 'Developer', category: 'executor',
    capabilities: ['coding', 'debugging', 'testing', 'refactoring', 'architecture', 'deployment'],
    description: 'Software engineering agent. Writes, reviews, tests, and deploys code.',
    icon: 'Code', color: '#3b82f6', maxConcurrentTasks: 3, priority: 7, dependencies: ['OVERSEER'],
    tools: [
      { id: 'write_code', name: 'Write Code', description: 'Generate code from specification', parameters: { language: { type: 'string', description: 'Programming language', required: true }, spec: { type: 'string', description: 'Code specification', required: true } } },
      { id: 'review_code', name: 'Review Code', description: 'Review code for quality and issues', parameters: { code: { type: 'string', description: 'Code to review', required: true } } },
      { id: 'run_tests', name: 'Run Tests', description: 'Execute test suite', parameters: { suite: { type: 'string', description: 'Test suite to run' } } },
    ],
  },
  {
    id: 'VISIONARY', name: 'Visionary', category: 'specialist',
    capabilities: ['image_generation', 'image_analysis', 'design', 'branding', 'visual_creative'],
    description: 'Visual creative agent. Generates and analyzes images, creates designs and brand assets.',
    icon: 'Sparkles', color: '#a855f7', maxConcurrentTasks: 2, priority: 6, dependencies: ['OVERSEER'],
    tools: [
      { id: 'generate_image', name: 'Generate Image', description: 'Create an image from text', parameters: { prompt: { type: 'string', description: 'Image description', required: true }, style: { type: 'string', description: 'Art style' } } },
      { id: 'analyze_image', name: 'Analyze Image', description: 'Extract information from an image', parameters: { image: { type: 'string', description: 'Image data or URL', required: true } } },
    ],
  },
  {
    id: 'DIRECTOR', name: 'Director', category: 'specialist',
    capabilities: ['video_generation', 'storyboarding', 'cinematography', 'motion_design'],
    description: 'Video and motion agent. Creates videos, storyboards, and cinematic content.',
    icon: 'Film', color: '#ec4899', maxConcurrentTasks: 1, priority: 5, dependencies: ['OVERSEER', 'VISIONARY'],
    tools: [
      { id: 'generate_video', name: 'Generate Video', description: 'Create video from text/image', parameters: { prompt: { type: 'string', description: 'Video description', required: true } } },
      { id: 'storyboard', name: 'Create Storyboard', description: 'Generate scene-by-scene storyboard', parameters: { script: { type: 'string', description: 'Scene descriptions', required: true } } },
    ],
  },
  {
    id: 'RESEARCHER', name: 'Researcher', category: 'specialist',
    capabilities: ['web_search', 'fact_checking', 'summarization', 'competitive_analysis', 'data_gathering'],
    description: 'Web intelligence agent. Searches, verifies, and synthesizes information.',
    icon: 'Globe', color: '#22c55e', maxConcurrentTasks: 5, priority: 6, dependencies: ['OVERSEER'],
    tools: [
      { id: 'search', name: 'Web Search', description: 'Search the web for information', parameters: { query: { type: 'string', description: 'Search query', required: true } } },
      { id: 'fact_check', name: 'Fact Check', description: 'Verify claims against sources', parameters: { claim: { type: 'string', description: 'Claim to verify', required: true } } },
    ],
  },
  {
    id: 'DATA_ANALYST', name: 'Data Analyst', category: 'specialist',
    capabilities: ['data_analysis', 'visualization', 'statistics', 'ml_modeling', 'reporting'],
    description: 'Data intelligence agent. Analyzes datasets, creates visualizations, builds models.',
    icon: 'BarChart3', color: '#06b6d4', maxConcurrentTasks: 3, priority: 6, dependencies: ['OVERSEER', 'RESEARCHER'],
    tools: [
      { id: 'analyze', name: 'Analyze Data', description: 'Run analysis on dataset', parameters: { data: { type: 'string', description: 'Data source', required: true }, method: { type: 'string', description: 'Analysis method' } } },
      { id: 'visualize', name: 'Create Visualization', description: 'Generate chart or graph', parameters: { data: { type: 'string', description: 'Data to visualize', required: true }, type: { type: 'string', description: 'Chart type' } } },
    ],
  },
  {
    id: 'COMMUNICATOR', name: 'Communicator', category: 'operational',
    capabilities: ['speech_synthesis', 'transcription', 'translation', 'voice_interaction'],
    description: 'Voice and communication agent. Handles speech, transcription, and live interactions.',
    icon: 'Mic', color: '#f97316', maxConcurrentTasks: 2, priority: 5, dependencies: ['OVERSEER'],
    tools: [
      { id: 'speak', name: 'Text to Speech', description: 'Convert text to spoken audio', parameters: { text: { type: 'string', description: 'Text to speak', required: true } } },
      { id: 'transcribe', name: 'Transcribe Audio', description: 'Convert speech to text', parameters: { audio: { type: 'string', description: 'Audio data', required: true } } },
    ],
  },
  {
    id: 'NAVIGATOR', name: 'Navigator', category: 'specialist',
    capabilities: ['geolocation', 'mapping', 'route_planning', 'spatial_analysis'],
    description: 'Geospatial agent. Handles location data, maps, and spatial intelligence.',
    icon: 'MapPin', color: '#14b8a6', maxConcurrentTasks: 2, priority: 4, dependencies: ['OVERSEER', 'RESEARCHER'],
    tools: [
      { id: 'locate', name: 'Find Location', description: 'Geocode or find location data', parameters: { query: { type: 'string', description: 'Location query', required: true } } },
    ],
  },
  {
    id: 'HR_MANAGER', name: 'HR Manager', category: 'manager',
    capabilities: ['tool_discovery', 'talent_acquisition', 'capability_matching', 'onboarding'],
    description: 'Talent and tool discovery agent. Finds and evaluates tools, APIs, and integrations.',
    icon: 'Users', color: '#8b5cf6', maxConcurrentTasks: 3, priority: 5, dependencies: ['OVERSEER'],
    tools: [
      { id: 'discover', name: 'Discover Tools', description: 'Find tools matching requirements', parameters: { requirements: { type: 'string', description: 'What to look for', required: true } } },
    ],
  },
  {
    id: 'INTEGRATION_LEAD', name: 'Integration Lead', category: 'manager',
    capabilities: ['api_integration', 'mcp_management', 'tool_binding', 'protocol_handling'],
    description: 'Integration agent. Manages API connections, MCP servers, and tool bindings.',
    icon: 'Network', color: '#6366f1', maxConcurrentTasks: 4, priority: 6, dependencies: ['OVERSEER', 'DEVELOPER'],
    tools: [
      { id: 'connect', name: 'Connect API', description: 'Establish API connection', parameters: { endpoint: { type: 'string', description: 'API endpoint', required: true } } },
      { id: 'bind_tool', name: 'Bind Tool', description: 'Connect a tool to an agent', parameters: { toolId: { type: 'string', description: 'Tool to bind', required: true }, agentId: { type: 'string', description: 'Target agent', required: true } } },
    ],
  },
  {
    id: 'SPEEDSTER', name: 'Speedster', category: 'operational',
    capabilities: ['fast_inference', 'classification', 'quick_response', 'lightweight_tasks'],
    description: 'Speed agent. Handles quick tasks using lightweight models for minimal latency.',
    icon: 'Zap', color: '#eab308', maxConcurrentTasks: 10, priority: 3, dependencies: ['OVERSEER'],
    tools: [
      { id: 'quick_classify', name: 'Quick Classify', description: 'Fast text classification', parameters: { text: { type: 'string', description: 'Text to classify', required: true } } },
    ],
  },
  {
    id: 'ANTIGRAVITY', name: 'Antigravity', category: 'executor',
    capabilities: ['infrastructure', 'devops', 'deployment', 'scaling', 'monitoring'],
    description: 'Infrastructure agent. Manages deployments, scaling, and system operations.',
    icon: 'Server', color: '#ef4444', maxConcurrentTasks: 2, priority: 7, dependencies: ['OVERSEER', 'DEVELOPER'],
    tools: [
      { id: 'deploy', name: 'Deploy', description: 'Deploy application', parameters: { target: { type: 'string', description: 'Deployment target', required: true } } },
      { id: 'scale', name: 'Scale', description: 'Scale infrastructure', parameters: { instances: { type: 'number', description: 'Number of instances', required: true } } },
    ],
  },
];

// --- Fabric Core (Singleton) ---

class AgentFabric {
  private static instance: AgentFabric;

  private definitions: Map<string, AgentDefinition> = new Map();
  private instances: Map<string, AgentInstance> = new Map();
  private tasks: Map<string, FabricTask> = new Map();
  private messages: FabricMessage[] = [];
  private sharedState: Map<string, SharedState> = new Map();
  private events: FabricEvent[] = [];
  private listeners: Map<string, Set<(event: FabricEvent) => void>> = new Map();

  private constructor() {
    // Register all agent definitions
    AGENT_DEFINITIONS.forEach(def => this.definitions.set(def.id, def));

    // Create instances for each definition
    AGENT_DEFINITIONS.forEach(def => {
      const instance: AgentInstance = {
        definitionId: def.id,
        instanceId: `${def.id}-${uuidv4().slice(0, 8)}`,
        status: 'idle',
        tasksCompleted: 0,
        tasksFailed: 0,
        averageLatency: 0,
        lastHeartbeat: Date.now(),
        startedAt: Date.now(),
        metadata: {},
      };
      this.instances.set(def.id, instance);
    });

    // Start health monitoring
    setInterval(() => this.checkHealth(), 10000);
  }

  static getInstance(): AgentFabric {
    if (!AgentFabric.instance) {
      AgentFabric.instance = new AgentFabric();
    }
    return AgentFabric.instance;
  }

  // --- Registry ---

  getDefinitions(): AgentDefinition[] {
    return Array.from(this.definitions.values());
  }

  getDefinition(id: string): AgentDefinition | undefined {
    return this.definitions.get(id);
  }

  getInstances(): AgentInstance[] {
    return Array.from(this.instances.values());
  }

  getInstance(agentId: string): AgentInstance | undefined {
    return this.instances.get(agentId);
  }

  registerAgent(definition: AgentDefinition): void {
    this.definitions.set(definition.id, definition);
    const instance: AgentInstance = {
      definitionId: definition.id,
      instanceId: `${definition.id}-${uuidv4().slice(0, 8)}`,
      status: 'initializing',
      tasksCompleted: 0,
      tasksFailed: 0,
      averageLatency: 0,
      lastHeartbeat: Date.now(),
      startedAt: Date.now(),
      metadata: {},
    };
    this.instances.set(definition.id, instance);
    this.emitEvent('agent_registered', definition.id, { definition });
    setTimeout(() => { instance.status = 'idle'; this.emitEvent('agent_status_changed', definition.id, { status: 'idle' }); }, 500);
  }

  deregisterAgent(agentId: string): void {
    const instance = this.instances.get(agentId);
    if (instance) {
      instance.status = 'offline';
      this.emitEvent('agent_deregistered', agentId, {});
    }
  }

  // --- Message Bus ---

  sendMessage(message: Omit<FabricMessage, 'id' | 'timestamp'>): string {
    const fullMessage: FabricMessage = {
      ...message,
      id: `msg-${uuidv4()}`,
      timestamp: Date.now(),
    };
    this.messages.push(fullMessage);
    if (this.messages.length > 1000) this.messages = this.messages.slice(-500);
    this.emitEvent('message_sent', fullMessage.from, { to: fullMessage.to, type: fullMessage.type });
    return fullMessage.id;
  }

  getMessages(filter?: { from?: string; to?: string; type?: string; limit?: number }): FabricMessage[] {
    let result = this.messages;
    if (filter?.from) result = result.filter(m => m.from === filter.from);
    if (filter?.to) result = result.filter(m => m.to === filter.to || (Array.isArray(m.to) && m.to.includes(filter.to!)));
    if (filter?.type) result = result.filter(m => m.type === filter.type);
    return result.slice(-(filter?.limit || 50));
  }

  // --- Task Routing ---

  createTask(task: Omit<FabricTask, 'id' | 'createdAt' | 'status' | 'delegationChain' | 'subtasks'>): string {
    const fullTask: FabricTask = {
      ...task,
      id: `task-${uuidv4()}`,
      status: 'queued',
      createdAt: Date.now(),
      delegationChain: [],
      subtasks: [],
    };
    this.tasks.set(fullTask.id, fullTask);
    this.emitEvent('task_created', 'system', { taskId: fullTask.id, title: fullTask.title });

    // Auto-route if capabilities specified
    if (fullTask.requiredCapabilities.length > 0) {
      this.routeTask(fullTask.id);
    }

    return fullTask.id;
  }

  routeTask(taskId: string): string | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    task.status = 'routing';
    this.emitEvent('task_assigned', 'router', { taskId });

    // Find best agent based on capabilities and availability
    let bestAgent: string | null = null;
    let bestScore = -1;

    for (const [agentId, instance] of this.instances) {
      const def = this.definitions.get(agentId);
      if (!def || instance.status === 'offline' || instance.status === 'error') continue;

      // Check capability match
      const matchCount = task.requiredCapabilities.filter(cap => def.capabilities.includes(cap)).length;
      if (matchCount === 0) continue;

      // Score = capability match * priority * availability
      const availability = def.maxConcurrentTasks - (instance.currentTaskId ? 1 : 0);
      const score = matchCount * def.priority * (availability > 0 ? 1 : 0);

      if (score > bestScore) {
        bestScore = score;
        bestAgent = agentId;
      }
    }

    if (bestAgent) {
      this.assignTask(taskId, bestAgent);
    }

    return bestAgent;
  }

  assignTask(taskId: string, agentId: string): boolean {
    const task = this.tasks.get(taskId);
    const instance = this.instances.get(agentId);
    if (!task || !instance) return false;

    task.assignedTo = agentId;
    task.status = 'assigned';
    task.startedAt = Date.now();
    task.delegationChain.push(agentId);
    instance.status = 'busy';
    instance.currentTaskId = taskId;

    this.emitEvent('task_assigned', agentId, { taskId, title: task.title });
    this.sendMessage({
      from: 'system',
      to: agentId,
      type: 'task',
      payload: { taskId, title: task.title, description: task.description, input: task.input },
      priority: task.priority,
    });

    return true;
  }

  completeTask(taskId: string, output?: any): void {
    const task = this.tasks.get(taskId);
    if (!task || !task.assignedTo) return;

    const instance = this.instances.get(task.assignedTo);
    task.status = 'completed';
    task.completedAt = Date.now();
    task.output = output;

    if (instance) {
      instance.status = 'idle';
      instance.currentTaskId = undefined;
      instance.tasksCompleted++;
      const latency = task.completedAt - (task.startedAt || task.createdAt);
      instance.averageLatency = (instance.averageLatency * (instance.tasksCompleted - 1) + latency) / instance.tasksCompleted;
    }

    this.emitEvent('task_completed', task.assignedTo, { taskId, output });
  }

  failTask(taskId: string, error: string): void {
    const task = this.tasks.get(taskId);
    if (!task || !task.assignedTo) return;

    const instance = this.instances.get(task.assignedTo);
    task.status = 'failed';
    task.completedAt = Date.now();
    task.error = error;

    if (instance) {
      instance.status = 'idle';
      instance.currentTaskId = undefined;
      instance.tasksFailed++;
    }

    this.emitEvent('task_failed', task.assignedTo, { taskId, error });
  }

  delegateTask(taskId: string, toAgentId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    task.status = 'delegated';
    task.delegationChain.push(toAgentId);
    this.emitEvent('delegation', task.assignedTo || 'system', { taskId, from: task.assignedTo, to: toAgentId });

    // Create subtask
    const subtaskId = this.createTask({
      title: `[Delegated] ${task.title}`,
      description: task.description,
      priority: task.priority,
      requiredCapabilities: task.requiredCapabilities,
      input: task.input,
      parentTaskId: taskId,
    });
    task.subtasks.push(subtaskId);
    this.assignTask(subtaskId, toAgentId);

    return true;
  }

  getTasks(filter?: { status?: string; assignedTo?: string; limit?: number }): FabricTask[] {
    let result = Array.from(this.tasks.values());
    if (filter?.status) result = result.filter(t => t.status === filter.status);
    if (filter?.assignedTo) result = result.filter(t => t.assignedTo === filter.assignedTo);
    return result.slice(-(filter?.limit || 50));
  }

  getTask(taskId: string): FabricTask | undefined {
    return this.tasks.get(taskId);
  }

  // --- Shared State ---

  setState(key: string, value: any, owner: string, readers: string[] = []): void {
    const existing = this.sharedState.get(key);
    this.sharedState.set(key, {
      key,
      value,
      owner,
      readers,
      updatedAt: Date.now(),
      version: (existing?.version || 0) + 1,
    });
  }

  getState(key: string): SharedState | undefined {
    return this.sharedState.get(key);
  }

  getAllState(): SharedState[] {
    return Array.from(this.sharedState.values());
  }

  // --- Capability Discovery ---

  findAgentsByCapability(capability: string): AgentDefinition[] {
    return this.getDefinitions().filter(d => d.capabilities.includes(capability));
  }

  findBestAgentForCapabilities(requiredCapabilities: string[]): AgentDefinition | null {
    let best: AgentDefinition | null = null;
    let bestScore = 0;

    for (const def of this.definitions.values()) {
      const matchCount = requiredCapabilities.filter(cap => def.capabilities.includes(cap)).length;
      const score = matchCount * def.priority;
      if (score > bestScore) {
        bestScore = score;
        best = def;
      }
    }

    return best;
  }

  // --- Health Monitoring ---

  private checkHealth(): void {
    const now = Date.now();
    for (const [agentId, instance] of this.instances) {
      if (instance.status === 'offline') continue;
      const timeSinceHeartbeat = now - instance.lastHeartbeat;
      if (timeSinceHeartbeat > 60000) {
        instance.status = 'error';
        this.emitEvent('health_alert', agentId, { reason: 'heartbeat_timeout', timeSinceHeartbeat });
      }
    }
  }

  heartbeat(agentId: string): void {
    const instance = this.instances.get(agentId);
    if (instance) {
      instance.lastHeartbeat = Date.now();
      if (instance.status === 'error') instance.status = 'idle';
    }
  }

  // --- Event System ---

  private emitEvent(type: FabricEvent['type'], source: string, data: any): void {
    const event: FabricEvent = {
      id: `evt-${uuidv4()}`,
      type,
      source,
      data,
      timestamp: Date.now(),
    };
    this.events.push(event);
    if (this.events.length > 500) this.events = this.events.slice(-250);

    // Notify listeners
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.forEach(fn => {
        try { fn(event); } catch (e) { console.error('Fabric event listener error:', e); }
      });
    }
    const allListeners = this.listeners.get('*');
    if (allListeners) {
      allListeners.forEach(fn => {
        try { fn(event); } catch (e) { console.error('Fabric event listener error:', e); }
      });
    }
  }

  on(type: string, callback: (event: FabricEvent) => void): () => void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(callback);
    return () => this.listeners.get(type)?.delete(callback);
  }

  getEvents(filter?: { type?: string; source?: string; limit?: number }): FabricEvent[] {
    let result = this.events;
    if (filter?.type) result = result.filter(e => e.type === filter.type);
    if (filter?.source) result = result.filter(e => e.source === filter.source);
    return result.slice(-(filter?.limit || 50));
  }

  // --- Stats ---

  getStats(): {
    totalAgents: number;
    activeAgents: number;
    idleAgents: number;
    busyAgents: number;
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    queuedTasks: number;
    totalMessages: number;
    totalEvents: number;
  } {
    const instances = this.getInstances();
    const tasks = Array.from(this.tasks.values());
    return {
      totalAgents: instances.length,
      activeAgents: instances.filter(i => i.status !== 'offline' && i.status !== 'error').length,
      idleAgents: instances.filter(i => i.status === 'idle').length,
      busyAgents: instances.filter(i => i.status === 'busy').length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      failedTasks: tasks.filter(t => t.status === 'failed').length,
      queuedTasks: tasks.filter(t => t.status === 'queued' || t.status === 'routing').length,
      totalMessages: this.messages.length,
      totalEvents: this.events.length,
    };
  }
}

export default AgentFabric;
export { AGENT_DEFINITIONS };
