import { Modality } from "@google/genai";

export enum AgentType {
  OVERSEER = 'OVERSEER', // Executive: Strategy & Orchestration
  HR_MANAGER = 'HR_MANAGER', // Manager: Talent Acquisition & Tool Discovery
  INTEGRATION_LEAD = 'INTEGRATION_LEAD', // Manager: API Integration & Tooling
  RESEARCHER = 'RESEARCHER', // Specialist: Web Intelligence (Browser-Use)
  DATA_ANALYST = 'DATA_ANALYST', // Specialist: Data Aggregation & Analysis
  DEVELOPER = 'DEVELOPER', // Executor: Software Engineering & Code Execution
  VISIONARY = 'VISIONARY', // Specialist: Image Gen, Image Analysis, Image Edit
  DIRECTOR = 'DIRECTOR', // Specialist: Video Gen
  COMMUNICATOR = 'COMMUNICATOR', // Operational: Live API, Transcription, TTS
  NAVIGATOR = 'NAVIGATOR', // Specialist: Geospatial
  SPEEDSTER = 'SPEEDSTER', // Operational: Fast Lite model
  ANTIGRAVITY = 'ANTIGRAVITY', // Executor: Infrastructure & DevOps
}

export type McpPlatform = 'google' | 'vertex' | 'openai' | 'anthropic' | 'xai' | 'deepseek' | 'huggingface' | 'replicate' | 'custom';

export interface McpProfile {
  id: string;
  name: string;
  key: string;
  isActive: boolean;
  platform: McpPlatform;
}

// --- MCP Protocol Definitions (v2024-11-05) ---

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  method: string;
  params?: any;
  id: number | string;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id: number | string;
}

export interface McpTool {
  name: string;
  description?: string;
  inputSchema: {
    type: "object";
    properties?: Record<string, any>;
    required?: string[];
  };
}

export interface McpCallToolResult {
  content: Array<{
    type: "text" | "image" | "resource";
    text?: string;
    data?: string;
    mimeType?: string;
    uri?: string;
  }>;
  isError?: boolean;
}

export interface McpResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface McpReadResourceResult {
  contents: Array<{
    uri: string;
    mimeType?: string;
    text?: string;
    blob?: string;
  }>;
}

export interface McpPromptArgument {
  name: string;
  description?: string;
  required?: boolean;
}

export interface McpPrompt {
  name: string;
  description?: string;
  arguments?: McpPromptArgument[];
}

export interface McpGetPromptResult {
  description?: string;
  messages: Array<{
    role: "user" | "assistant";
    content: {
      type: "text" | "image" | "resource";
      text?: string;
      data?: string;
      mimeType?: string;
      uri?: string;
    };
  }>;
}

// --- Transport Interfaces ---

export interface IMcpTransport {
  name: string;
  start(): Promise<void>;
  close(): Promise<void>;
  send(message: JsonRpcRequest): Promise<JsonRpcResponse>;
  isConnected(): boolean;
}

export interface McpConnection {
  id: string;
  transport: IMcpTransport;
  tools: McpTool[];
  status: 'connected' | 'disconnected' | 'error';
  error?: string;
}

// -------------------------------

export interface CanvasArtifact {
  id: string;
  title: string;
  type: 'html' | 'react' | 'python' | 'markdown' | 'json';
  content: string;
  timestamp: number;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  subtasks: SubTask[];
  completed: boolean;
  isParallel?: boolean; // New: indicates if task can be processed in parallel
  dependencies?: string[]; // IDs of tasks that must be completed first
  assignedAgent?: AgentType; // The specialized agent best suited for this task
  output?: string; // The result of the task execution
}

export interface InputAsset {
  type: 'image' | 'video';
  data: string; // Base64 or Data URI
  mimeType: string;
}

export interface MemoryNode {
  id: string;
  content: string;
  embedding: number[];
  timestamp: number;
  type: 'user_fact' | 'interaction' | 'system_note';
  relevance: number; // Runtime calculated relevance to current context
  tags: string[];
  isPinned?: boolean; // Level 7: Persistent context
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text?: string;
  
  // Model generated assets
  image?: string; // base64 (Legacy/Generated)
  videoUri?: string; // for generated videos
  audioData?: string; // base64 for TTS
  
  // User uploaded assets
  inputAsset?: InputAsset;

  groundingLinks?: Array<{ title: string; uri: string }>;
  tasks?: Task[]; // Optional task list returned or managed
  timestamp: number;
  isThinking?: boolean;
  qualityScore?: number;
  antiPatterns?: string[];
  toolCalls?: Array<{ name: string; args: any }>;
  metadata?: {
    modelUsed?: string;
    provider?: string;
  };
}

export type ImageAspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '9:16' | '16:9' | '21:9';

export interface ImageGenerationConfig {
  prompt: string;
  size: '1K' | '2K' | '4K';
  aspectRatio: ImageAspectRatio;
  provider?: 'google' | 'huggingface' | 'auto';
}

export interface VideoModel {
  id: string;
  name: string;
  provider: 'google' | 'huggingface' | 'replicate';
  tier: 1 | 2 | 3;
  capabilities: ('t2v' | 'i2v')[];
  description: string;
  apiPath?: string;
  isFreeTier?: boolean;
}

export interface VideoGenerationConfig {
  prompt: string;
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p'; 
  image?: string; // Base64
  modelId?: string; // Selected model ID
}

export interface AgentStatus {
  id: AgentType;
  name: string;
  description: string;
  status: 'idle' | 'active' | 'thinking' | 'streaming';
  icon: any;
}