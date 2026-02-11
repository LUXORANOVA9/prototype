import { McpTool, McpCallToolResult, McpConnection, IMcpTransport, JsonRpcRequest } from "../types";
import { InternalTransport, SseTransport } from "./mcpTransport";
import { FunctionDeclaration, Type } from "@google/genai";

// Mock Transport for Simulated Installed Tools
class SimulatedTransport implements IMcpTransport {
  public name: string;
  private connected = true;
  private handler: (req: JsonRpcRequest) => Promise<any>;

  constructor(name: string, handler: (req: JsonRpcRequest) => Promise<any>) {
    this.name = name;
    this.handler = handler;
  }

  async start() { this.connected = true; }
  async close() { this.connected = false; }
  isConnected() { return this.connected; }
  
  async send(message: JsonRpcRequest): Promise<any> {
    if (message.method === 'tools/list') return { result: { tools: [] } }; // Handled by client logic
    return await this.handler(message);
  }
}

class McpClientService {
  private connections: Map<string, McpConnection> = new Map();

  constructor() {
    // Auto-connect internal server
    this.connectInternal();
  }

  private async connectInternal() {
    const transport = new InternalTransport();
    await this.registerConnection("internal", transport);
  }

  public async connectSse(url: string) {
    const id = `sse-${Date.now()}`;
    const transport = new SseTransport(url);
    await this.registerConnection(id, transport);
    return id;
  }

  public async registerSimulatedConnection(id: string, name: string, tools: McpTool[], handler: (name: string, args: any) => Promise<McpCallToolResult>) {
      const transport = new SimulatedTransport(name, async (req) => {
          if (req.method === 'tools/call') {
              const res = await handler(req.params.name, req.params.arguments);
              return { result: res };
          }
          return { result: {} };
      });
      
      this.connections.set(id, {
          id,
          transport,
          tools,
          status: 'connected'
      });
      console.log(`[MCP Client] Installed simulated package: ${name}`);
  }

  public isSseConnected(url: string): boolean {
    for (const conn of this.connections.values()) {
        if (conn.transport instanceof SseTransport && conn.transport.endpoint === url && conn.status === 'connected') {
            return true;
        }
    }
    return false;
  }

  private async registerConnection(id: string, transport: IMcpTransport) {
    try {
      await transport.start();
      
      // Discover Tools
      const request: JsonRpcRequest = {
        jsonrpc: "2.0",
        method: "tools/list",
        id: Date.now()
      };
      
      const response = await transport.send(request);
      
      if (response.error) {
        throw new Error(response.error.message);
      }

      const tools: McpTool[] = (response.result as any).tools || [];
      
      this.connections.set(id, {
        id,
        transport,
        tools,
        status: 'connected'
      });
      console.log(`[MCP Client] Registered connection ${id} with ${tools.length} tools.`);

    } catch (e: any) {
      console.error(`[MCP Client] Failed to register connection ${id}:`, e);
      this.connections.set(id, {
        id,
        transport,
        tools: [],
        status: 'error',
        error: e.message
      });
    }
  }

  public async disconnect(id: string) {
    const conn = this.connections.get(id);
    if (conn) {
      await conn.transport.close();
      this.connections.delete(id);
    }
  }

  public getConnections(): McpConnection[] {
    return Array.from(this.connections.values());
  }

  public getAllTools(): { tool: McpTool, connectionId: string }[] {
    const allTools: { tool: McpTool, connectionId: string }[] = [];
    this.connections.forEach(conn => {
      if (conn.status === 'connected') {
        conn.tools.forEach(t => allTools.push({ tool: t, connectionId: conn.id }));
      }
    });
    return allTools;
  }

  /**
   * Convert all MCP tools to Gemini FunctionDeclarations
   */
  public getGeminiFunctionDeclarations(): FunctionDeclaration[] {
    const tools = this.getAllTools();
    return tools.map(({ tool }) => ({
      name: tool.name, // Note: Collisions possible. In robust app, namespace this: `${connectionId}__${tool.name}`
      description: tool.description,
      parameters: {
        type: Type.OBJECT,
        properties: tool.inputSchema.properties as any,
        required: tool.inputSchema.required
      }
    }));
  }

  public async callTool(name: string, args: any): Promise<McpCallToolResult> {
    // Find who owns this tool
    // Strategy: First match. 
    // Improvement: Map tool names to IDs to avoid linear search or collisions.
    let targetConn: McpConnection | undefined;
    
    for (const conn of this.connections.values()) {
        if (conn.status === 'connected' && conn.tools.some(t => t.name === name)) {
            targetConn = conn;
            break;
        }
    }

    if (!targetConn) {
        throw new Error(`Tool '${name}' not found in any active MCP connection.`);
    }

    const request: JsonRpcRequest = {
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
            name,
            arguments: args
        },
        id: Date.now()
    };

    const response = await targetConn.transport.send(request);

    if (response.error) {
        return {
            content: [{ type: "text", text: `Error calling ${name}: ${response.error.message}` }],
            isError: true
        };
    }

    // Parse standard MCP result
    // Some simulated transports might wrap result in result.result, standard transports just return the result object
    const resultData = (response as any).result?.content ? (response as any).result : response;
    
    return resultData as McpCallToolResult;
  }
}

export const mcpClient = new McpClientService();