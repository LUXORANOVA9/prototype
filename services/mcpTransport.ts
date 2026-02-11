import { JsonRpcRequest, JsonRpcResponse, IMcpTransport } from "../types";
import { mcpServer } from "./mcpServer";

/**
 * Transport for communicating with the internal LuxorMcpServer instance.
 */
export class InternalTransport implements IMcpTransport {
  public name = "Internal Core";
  private connected = false;

  async start(): Promise<void> {
    this.connected = true;
    console.log("[MCP Internal] Connected.");
  }

  async close(): Promise<void> {
    this.connected = false;
  }

  async send(message: JsonRpcRequest): Promise<JsonRpcResponse> {
    if (!this.connected) throw new Error("Internal Transport not connected");
    // Direct function call to the server singleton
    return await mcpServer.handleMessage(message);
  }

  isConnected(): boolean {
    return this.connected;
  }
}

/**
 * Transport for communicating with external MCP servers via SSE (Server-Sent Events).
 * Spec: https://spec.modelcontextprotocol.io/docs/concepts/transports/sse/
 */
export class SseTransport implements IMcpTransport {
  public name: string;
  private eventSource: EventSource | null = null;
  public endpoint: string;
  private postEndpoint?: string;
  private connected = false;

  constructor(url: string, name?: string) {
    this.endpoint = url;
    this.name = name || `Remote (${url})`;
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const es = new EventSource(this.endpoint);
        
        es.onopen = (e) => {
          console.log(`[MCP SSE] Connected to ${this.endpoint}`);
          this.connected = true;
          this.eventSource = es;
          resolve();
        };

        es.onerror = (e) => {
           console.error(`[MCP SSE] Error on ${this.endpoint}`, e);
           if (!this.connected) reject(new Error("Failed to connect to SSE endpoint"));
           // If already connected, we might want to handle reconnection logic or close
           this.close(); 
        };

        es.addEventListener("endpoint", (e: MessageEvent) => {
           // The server sends the POST endpoint via an 'endpoint' event
           this.postEndpoint = new URL(e.data, this.endpoint).toString();
           console.log(`[MCP SSE] Received write endpoint: ${this.postEndpoint}`);
        });

        // We also need to handle JSON-RPC messages coming down the wire if the server pushes them
        // Note: For 'callTool', usually we send a POST and get a response. 
        // Notifications might come here.
        es.onmessage = (e) => {
            // Handle incoming notifications if necessary
        };

      } catch (err) {
        reject(err);
      }
    });
  }

  async close(): Promise<void> {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.connected = false;
  }

  async send(message: JsonRpcRequest): Promise<JsonRpcResponse> {
    if (!this.connected) throw new Error("SSE Transport not connected");
    
    // For SSE, we typically send requests via HTTP POST to the sidecar endpoint
    // If we haven't received a specific 'endpoint' event, we might guess or fail.
    // Spec says: "The client must initially connect to the SSE endpoint... The server must send an endpoint event... indicating the URI"
    
    // Fallback: if no endpoint event received yet, assume relative /message or similar? 
    // Actually, for a quick implementation, many simple servers just accept POSTs at the same URL or /messages.
    // But let's require the 'endpoint' event or user config.
    
    const targetUrl = this.postEndpoint || this.endpoint; // Fallback to base (risky but common in simple implementations)

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message)
    });

    if (!response.ok) {
        throw new Error(`MCP POST failed: ${response.statusText}`);
    }

    // The response to the POST is usually the JSON-RPC response
    const json = await response.json();
    return json as JsonRpcResponse;
  }

  isConnected(): boolean {
    return this.connected;
  }
}