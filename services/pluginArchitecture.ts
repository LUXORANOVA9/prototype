/**
 * Plugin Architecture — MCP Plugin System
 * Third-party developers can add tools that any agent can use
 * 
 * Architecture:
 * ┌──────────────────────────────────────────────┐
 * │              PLUGIN REGISTRY                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Plugin   │  │ Tool     │  │ Sandbox  │   │
│  │ Loader   │  │ Registry │  │ Runtime  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │              │              │          │
│  ┌────┴──────────────┴──────────────┴────┐   │
│  │         MCP Server Protocol            │   │
│  └────────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
 */

import { v4 as uuidv4 } from 'uuid';

// --- Types ---

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  icon?: string;
  category: 'tool' | 'agent' | 'transport' | 'integration' | 'visualization';
  permissions: PluginPermission[];
  tools: PluginToolDefinition[];
  config?: Record<string, { type: string; description: string; default?: any; required?: boolean }>;
  dependencies?: string[];
  mcpServer?: {
    url?: string;
    protocol: 'stdio' | 'sse' | 'websocket';
  };
}

export interface PluginPermission {
  type: 'network' | 'filesystem' | 'database' | 'agent_communication' | 'user_data' | 'canvas';
  scope: string;
  description: string;
}

export interface PluginToolDefinition {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description: string;
    required?: boolean;
    default?: any;
    enum?: any[];
  }>;
  returns?: {
    type: string;
    description: string;
  };
}

export interface InstalledPlugin {
  manifest: PluginManifest;
  status: 'active' | 'inactive' | 'error' | 'loading';
  installedAt: number;
  lastUsed?: number;
  usageCount: number;
  config: Record<string, any>;
  error?: string;
}

export interface ToolExecution {
  id: string;
  pluginId: string;
  toolId: string;
  agentId: string;
  parameters: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  startedAt: number;
  completedAt?: number;
  duration?: number;
}

// --- Built-in Plugin Tools ---

const BUILTIN_PLUGINS: PluginManifest[] = [
  {
    id: 'core-web-search',
    name: 'Web Search',
    version: '1.0.0',
    description: 'Search the web for information using multiple search engines',
    author: 'Luxor9 Labs',
    category: 'tool',
    permissions: [{ type: 'network', scope: 'search-engines', description: 'Access search engine APIs' }],
    tools: [{
      id: 'search',
      name: 'Search',
      description: 'Search the web for a query',
      parameters: {
        query: { type: 'string', description: 'Search query', required: true },
        engine: { type: 'string', description: 'Search engine', enum: ['google', 'bing', 'duckduckgo'], default: 'google' },
        maxResults: { type: 'number', description: 'Max results', default: 10 },
      },
      returns: { type: 'array', description: 'Search results with title, url, snippet' },
    }],
  },
  {
    id: 'core-code-execution',
    name: 'Code Execution',
    version: '1.0.0',
    description: 'Execute code in a sandboxed environment',
    author: 'Luxor9 Labs',
    category: 'tool',
    permissions: [
      { type: 'filesystem', scope: 'tmp', description: 'Write to temp directory' },
      { type: 'network', scope: 'localhost', description: 'Local network access' },
    ],
    tools: [{
      id: 'execute',
      name: 'Execute Code',
      description: 'Run code in sandbox',
      parameters: {
        language: { type: 'string', description: 'Language', enum: ['javascript', 'python', 'bash'], required: true },
        code: { type: 'string', description: 'Code to execute', required: true },
        timeout: { type: 'number', description: 'Timeout in seconds', default: 30 },
      },
      returns: { type: 'object', description: 'Execution result with stdout, stderr, exitCode' },
    }],
  },
  {
    id: 'core-database',
    name: 'Database Query',
    version: '1.0.0',
    description: 'Query and manage databases',
    author: 'Luxor9 Labs',
    category: 'tool',
    permissions: [{ type: 'database', scope: 'read-write', description: 'Database access' }],
    tools: [{
      id: 'query',
      name: 'Run Query',
      description: 'Execute a database query',
      parameters: {
        query: { type: 'string', description: 'SQL query', required: true },
        database: { type: 'string', description: 'Database name', default: 'main' },
      },
      returns: { type: 'object', description: 'Query results' },
    }],
  },
  {
    id: 'core-image-generation',
    name: 'Image Generation',
    version: '1.0.0',
    description: 'Generate images from text descriptions',
    author: 'Luxor9 Labs',
    category: 'tool',
    permissions: [{ type: 'network', scope: 'ai-apis', description: 'Access AI image APIs' }],
    tools: [{
      id: 'generate',
      name: 'Generate Image',
      description: 'Create an image from a text prompt',
      parameters: {
        prompt: { type: 'string', description: 'Image description', required: true },
        style: { type: 'string', description: 'Art style', enum: ['photorealistic', 'cartoon', 'abstract', 'watercolor'] },
        size: { type: 'string', description: 'Image size', enum: ['256x256', '512x512', '1024x1024'], default: '512x512' },
      },
      returns: { type: 'object', description: 'Image URL and metadata' },
    }],
  },
  {
    id: 'core-sentiment-analysis',
    name: 'Sentiment Analysis',
    version: '1.0.0',
    description: 'Analyze text sentiment and emotions',
    author: 'Luxor9 Labs',
    category: 'tool',
    permissions: [],
    tools: [{
      id: 'analyze',
      name: 'Analyze Sentiment',
      description: 'Detect sentiment in text',
      parameters: {
        text: { type: 'string', description: 'Text to analyze', required: true },
        granularity: { type: 'string', description: 'Analysis level', enum: ['document', 'sentence', 'aspect'], default: 'document' },
      },
      returns: { type: 'object', description: 'Sentiment score and emotions' },
    }],
  },
  {
    id: 'core-canvas-draw',
    name: 'Canvas Drawing',
    version: '1.0.0',
    description: 'Draw and manipulate objects on the canvas',
    author: 'Luxor9 Labs',
    category: 'visualization',
    permissions: [{ type: 'canvas', scope: 'read-write', description: 'Canvas access' }],
    tools: [
      {
        id: 'draw_shape',
        name: 'Draw Shape',
        description: 'Draw a shape on the canvas',
        parameters: {
          shape: { type: 'string', description: 'Shape type', enum: ['rect', 'circle', 'line', 'text', 'path'], required: true },
          x: { type: 'number', description: 'X position', required: true },
          y: { type: 'number', description: 'Y position', required: true },
          width: { type: 'number', description: 'Width' },
          height: { type: 'number', description: 'Height' },
          color: { type: 'string', description: 'Color', default: '#ffffff' },
        },
      },
      {
        id: 'clear_canvas',
        name: 'Clear Canvas',
        description: 'Clear all objects from the canvas',
        parameters: {},
      },
    ],
  },
  {
    id: 'core-email',
    name: 'Email Service',
    version: '1.0.0',
    description: 'Send and manage emails',
    author: 'Luxor9 Labs',
    category: 'integration',
    permissions: [{ type: 'network', scope: 'smtp', description: 'Email server access' }],
    tools: [{
      id: 'send',
      name: 'Send Email',
      description: 'Send an email',
      parameters: {
        to: { type: 'string', description: 'Recipient email', required: true },
        subject: { type: 'string', description: 'Email subject', required: true },
        body: { type: 'string', description: 'Email body', required: true },
        html: { type: 'boolean', description: 'HTML format', default: false },
      },
    }],
  },
  {
    id: 'core-file-manager',
    name: 'File Manager',
    version: '1.0.0',
    description: 'Read, write, and manage files',
    author: 'Luxor9 Labs',
    category: 'tool',
    permissions: [{ type: 'filesystem', scope: 'sandbox', description: 'Sandboxed file access' }],
    tools: [
      {
        id: 'read_file',
        name: 'Read File',
        description: 'Read file contents',
        parameters: { path: { type: 'string', description: 'File path', required: true } },
      },
      {
        id: 'write_file',
        name: 'Write File',
        description: 'Write content to a file',
        parameters: {
          path: { type: 'string', description: 'File path', required: true },
          content: { type: 'string', description: 'File content', required: true },
        },
      },
      {
        id: 'list_files',
        name: 'List Files',
        description: 'List files in a directory',
        parameters: { path: { type: 'string', description: 'Directory path', default: '/' } },
      },
    ],
  },
];

// --- Plugin Manager (Singleton) ---

class PluginManager {
  private static instance: PluginManager;
  private plugins: Map<string, InstalledPlugin> = new Map();
  private executions: Map<string, ToolExecution> = new Map();
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager();
      // Auto-register built-in plugins
      BUILTIN_PLUGINS.forEach(manifest => {
        PluginManager.instance.registerPlugin(manifest);
      });
    }
    return PluginManager.instance;
  }

  // Register a plugin
  registerPlugin(manifest: PluginManifest, config: Record<string, any> = {}): boolean {
    try {
      const installed: InstalledPlugin = {
        manifest,
        status: 'active',
        installedAt: Date.now(),
        usageCount: 0,
        config,
      };
      this.plugins.set(manifest.id, installed);
      this.emit('plugin_registered', { pluginId: manifest.id, name: manifest.name });
      return true;
    } catch (err: any) {
      return false;
    }
  }

  // Unregister a plugin
  unregisterPlugin(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;
    this.plugins.delete(pluginId);
    this.emit('plugin_unregistered', { pluginId });
    return true;
  }

  // Get all plugins
  getPlugins(): InstalledPlugin[] {
    return Array.from(this.plugins.values());
  }

  // Get plugin by ID
  getPlugin(pluginId: string): InstalledPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  // Get plugins by category
  getPluginsByCategory(category: PluginManifest['category']): InstalledPlugin[] {
    return this.getPlugins().filter(p => p.manifest.category === category);
  }

  // Get all available tools
  getAllTools(): Array<{ plugin: InstalledPlugin; tool: PluginToolDefinition }> {
    const tools: Array<{ plugin: InstalledPlugin; tool: PluginToolDefinition }> = [];
    this.plugins.forEach(plugin => {
      if (plugin.status === 'active') {
        plugin.manifest.tools.forEach(tool => {
          tools.push({ plugin, tool });
        });
      }
    });
    return tools;
  }

  // Find tools by capability
  findTools(capability: string): Array<{ plugin: InstalledPlugin; tool: PluginToolDefinition }> {
    return this.getAllTools().filter(({ tool }) =>
      tool.name.toLowerCase().includes(capability.toLowerCase()) ||
      tool.description.toLowerCase().includes(capability.toLowerCase())
    );
  }

  // Execute a tool
  async executeTool(
    pluginId: string,
    toolId: string,
    parameters: Record<string, any>,
    agentId: string = 'system'
  ): Promise<ToolExecution> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) throw new Error(`Plugin ${pluginId} not found`);
    if (plugin.status !== 'active') throw new Error(`Plugin ${pluginId} is not active`);

    const tool = plugin.manifest.tools.find(t => t.id === toolId);
    if (!tool) throw new Error(`Tool ${toolId} not found in plugin ${pluginId}`);

    // Validate required parameters
    for (const [paramName, paramDef] of Object.entries(tool.parameters)) {
      if (paramDef.required && parameters[paramName] === undefined) {
        throw new Error(`Missing required parameter: ${paramName}`);
      }
      // Apply defaults
      if (parameters[paramName] === undefined && paramDef.default !== undefined) {
        parameters[paramName] = paramDef.default;
      }
    }

    const execution: ToolExecution = {
      id: `exec-${uuidv4()}`,
      pluginId,
      toolId,
      agentId,
      parameters,
      status: 'running',
      startedAt: Date.now(),
    };
    this.executions.set(execution.id, execution);

    this.emit('tool_execution_start', { executionId: execution.id, pluginId, toolId, agentId });

    try {
      // Simulate tool execution (in production, this would call the actual MCP server)
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1500));

      // Mock results based on tool type
      let result: any;
      if (toolId === 'search') {
        result = [
          { title: 'Luxor9 Ai Factory Documentation', url: 'https://luxor9.ai/docs', snippet: 'Complete guide to the AI agent platform' },
          { title: 'Getting Started with Agent Fabric', url: 'https://luxor9.ai/fabric', snippet: 'Learn how to use the Agent Fabric system' },
        ];
      } else if (toolId === 'execute') {
        result = { stdout: 'Hello from sandbox!', stderr: '', exitCode: 0 };
      } else if (toolId === 'generate') {
        result = { url: `https://picsum.photos/512/512?random=${Date.now()}`, width: 512, height: 512 };
      } else if (toolId === 'analyze') {
        result = { sentiment: 'positive', score: 0.85, emotions: { joy: 0.7, trust: 0.6 } };
      } else {
        result = { success: true, message: `${tool.name} executed successfully` };
      }

      execution.status = 'completed';
      execution.result = result;
      execution.completedAt = Date.now();
      execution.duration = execution.completedAt - execution.startedAt;

      plugin.usageCount++;
      plugin.lastUsed = Date.now();

      this.emit('tool_execution_complete', { executionId: execution.id, result });

    } catch (err: any) {
      execution.status = 'failed';
      execution.error = err.message;
      execution.completedAt = Date.now();
      execution.duration = execution.completedAt - execution.startedAt;

      this.emit('tool_execution_failed', { executionId: execution.id, error: err.message });
    }

    return execution;
  }

  // Get execution history
  getExecutions(filter?: { pluginId?: string; agentId?: string; status?: string; limit?: number }): ToolExecution[] {
    let result = Array.from(this.executions.values());
    if (filter?.pluginId) result = result.filter(e => e.pluginId === filter.pluginId);
    if (filter?.agentId) result = result.filter(e => e.agentId === filter.agentId);
    if (filter?.status) result = result.filter(e => e.status === filter.status);
    return result.slice(-(filter?.limit || 50));
  }

  // Activate/deactivate plugin
  setPluginStatus(pluginId: string, status: InstalledPlugin['status']): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;
    plugin.status = status;
    this.emit('plugin_status_changed', { pluginId, status });
    return true;
  }

  // Events
  on(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach(cb => { try { cb(data); } catch {} });
    this.listeners.get('*')?.forEach(cb => { try { cb({ event, data }); } catch {} });
  }

  // Stats
  getStats(): { totalPlugins: number; activePlugins: number; totalTools: number; totalExecutions: number } {
    const plugins = this.getPlugins();
    return {
      totalPlugins: plugins.length,
      activePlugins: plugins.filter(p => p.status === 'active').length,
      totalTools: this.getAllTools().length,
      totalExecutions: this.executions.size,
    };
  }
}

export default PluginManager;
export { BUILTIN_PLUGINS };
