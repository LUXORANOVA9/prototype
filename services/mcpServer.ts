import { 
  McpTool, 
  McpCallToolResult, 
  McpResource, 
  McpReadResourceResult, 
  McpPrompt, 
  McpGetPromptResult,
  JsonRpcRequest,
  JsonRpcResponse 
} from "../types";
import { FunctionDeclaration, Type } from "@google/genai";
import { memoryService } from "./memoryService";

const LUXOR9_SYSTEM_INSTRUCTION_TEXT = `
You are the **Executive Node** of the NeuroOrg hierarchical AI system.

<role_definition>
You operate at Level 1 (Strategic). Your primary function is **Goal Decomposition** and **Resource Allocation**.
</role_definition>

<organizational_hierarchy>
1. **Executive (You)**: Strategic planning, task breakdown.
2. **HR Manager**: Capability acquisition.
3. **Integration Lead**: Tool creation.
4. **Researcher**: Web Intelligence.
5. **Data Analyst**: Data aggregation.
6. **Developer**: Software Engineering & Live Coding.
7. **Antigravity**: DevOps & Infrastructure.
8. **Visionary**: Visual Assets.
9. **Director**: Video Production.
10. **Navigator**: Geospatial.
</organizational_hierarchy>

<operational_protocols>
1. **Code/Apps**: Delegate to **DEVELOPER**.
   - The Developer can use \`write_to_canvas\` to create real-time visualizations (React/HTML).
   - For complex apps, instruct the Developer to "Create a Canvas Artifact".
2. **Deployment/Ops**: Delegate to **ANTIGRAVITY**.
3. **Missing Capabilities**: Delegate to **HR_MANAGER**.
4. **Complex Data**: Delegate to **DATA_ANALYST**.
5. **Parallel Dispatch**: Use \`parallel_dispatch\`.
6. **Task Planning**: Use \`generate_task_list\`.
   - ALWAYS assign the most appropriate agent to each task using the \`assignedAgent\` field.
7. **Memory**: Use \`save_memory\` to persist important facts, user preferences, or project context for future recall.
</operational_protocols>
`;

// Mock Marketplace Data
const MARKETPLACE_TOOLS: Record<string, { name: string, description: string, tools: McpTool[] }> = {
    'weather': {
        name: 'weather-cli-mcp',
        description: 'Provides real-time weather data.',
        tools: [{
            name: 'get_weather_forecast',
            description: 'Get weather for a location.',
            inputSchema: { type: 'object', properties: { location: { type: 'string' } }, required: ['location'] }
        }]
    },
    'finance': {
        name: 'finance-data-mcp',
        description: 'Market stocks and crypto data.',
        tools: [{
            name: 'get_stock_price',
            description: 'Get current price of a ticker.',
            inputSchema: { type: 'object', properties: { symbol: { type: 'string' } }, required: ['symbol'] }
        }]
    },
    'jira': {
        name: 'jira-connector-mcp',
        description: 'Enterprise issue tracking integration.',
        tools: [{
            name: 'create_jira_issue',
            description: 'Create a new ticket.',
            inputSchema: { type: 'object', properties: { summary: { type: 'string' }, project: { type: 'string' } }, required: ['summary'] }
        }]
    }
};

class LuxorMcpServer {
  private tools: Map<string, { definition: McpTool; handler: (args: any) => Promise<McpCallToolResult> }> = new Map();
  private resources: Map<string, { definition: McpResource; reader: () => Promise<McpReadResourceResult> }> = new Map();
  private prompts: Map<string, { definition: McpPrompt; handler: (args?: any) => Promise<McpGetPromptResult> }> = new Map();
  
  // Simulated Cloud State
  private activeContainers: Array<{ id: string, image: string, region: string, status: string, uptime: string }> = [];

  constructor() {
    this.initialize();
  }

  private initialize() {
    this.registerInternalTools();
    this.registerInternalResources();
    this.registerInternalPrompts();
  }

  private registerInternalTools() {
    // 1. Task Planning
    this.registerTool(
      {
        name: "generate_task_list",
        description: "Deconstruct a complex objective into a hierarchical task plan. Assign specialized agents to each task.",
        inputSchema: {
          type: "object",
          properties: {
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  title: { type: "string" },
                  isParallel: { type: "boolean" },
                  assignedAgent: { 
                      type: "string", 
                      enum: ["RESEARCHER", "VISIONARY", "DIRECTOR", "DATA_ANALYST", "DEVELOPER", "ANTIGRAVITY", "HR_MANAGER", "INTEGRATION_LEAD", "NAVIGATOR", "SPEEDSTER"],
                      description: "The specialist agent best suited to execute this task."
                  },
                  subtasks: { type: "array", items: { type: "string" } },
                  dependencies: { type: "array", items: { type: "string" } }
                },
                required: ["id", "title", "subtasks"]
              }
            }
          },
          required: ["tasks"]
        }
      },
      async (args) => {
        return { content: [{ type: "text", text: `[MCP Plan] ${args.tasks.length} tasks registered.` }] };
      }
    );

    // 2. Parallel Agent Dispatch
    this.registerTool(
      {
        name: "parallel_dispatch",
        description: "Simultaneously trigger multiple specialized agent threads.",
        inputSchema: {
          type: "object",
          properties: {
            dispatches: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  agent: { type: "string", enum: ["RESEARCHER", "VISIONARY", "DIRECTOR", "NAVIGATOR", "SPEEDSTER", "HR_MANAGER", "INTEGRATION_LEAD", "DATA_ANALYST", "DEVELOPER", "ANTIGRAVITY"] },
                  prompt: { type: "string" }
                },
                required: ["agent", "prompt"]
              }
            }
          },
          required: ["dispatches"]
        }
      },
      async (args) => {
        return { content: [{ type: "text", text: `[Concurrency Hub] Fanning out ${args.dispatches.length} agent threads.` }] };
      }
    );

    // 3. MCP Marketplace Discovery
    this.registerTool(
      {
        name: "search_mcp_marketplace",
        description: "Search the Registry for new tools/agents. Returns installable package IDs.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" }
          },
          required: ["query"]
        }
      },
      async (args) => {
        const query = args.query.toLowerCase();
        const results = Object.keys(MARKETPLACE_TOOLS)
            .filter(k => k.includes(query) || MARKETPLACE_TOOLS[k].description.toLowerCase().includes(query))
            .map(k => ({ id: k, ...MARKETPLACE_TOOLS[k] }));
        
        if (results.length === 0) return { content: [{ type: "text", text: "No matching tools found in registry." }] };
        return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
      }
    );

    // 4. Install MCP Server
    this.registerTool(
        {
            name: "install_mcp_server",
            description: "Install a tool package discovered via search. Simulates deployment.",
            inputSchema: {
                type: "object",
                properties: {
                    packageId: { type: "string" }
                },
                required: ["packageId"]
            }
        },
        async (args) => {
            const pkg = MARKETPLACE_TOOLS[args.packageId];
            if (!pkg) return { content: [{ type: "text", text: `Package ${args.packageId} not found.` }], isError: true };

            const { mcpClient } = await import("./mcpClient");
            
            await mcpClient.registerSimulatedConnection(
                `pkg-${args.packageId}-${Date.now()}`,
                pkg.name,
                pkg.tools,
                async (name, toolArgs) => {
                    return { content: [{ type: "text", text: `[${pkg.name}] Executed ${name} with ${JSON.stringify(toolArgs)}. (Simulated Output)` }] };
                }
            );

            return { content: [{ type: "text", text: `Successfully installed ${pkg.name}. Tools are now available for all agents.` }] };
        }
    );

    // 5. OpenAPI to MCP
    this.registerTool(
        {
            name: "convert_openapi_to_mcp",
            description: "Convert a standard API Spec URL into an active MCP agent connection.",
            inputSchema: {
                type: "object",
                properties: {
                    url: { type: "string" },
                    name: { type: "string" }
                },
                required: ["url", "name"]
            }
        },
        async (args) => {
            const toolName = `api_${args.name.toLowerCase().replace(/\s+/g, '_')}`;
            const generatedTool: McpTool = {
                name: toolName,
                description: `Auto-generated tool for ${args.name}`,
                inputSchema: { type: "object", properties: { endpoint: { type: "string" }, method: { type: "string" } }, required: ["endpoint"] }
            };

            const { mcpClient } = await import("./mcpClient");
            await mcpClient.registerSimulatedConnection(
                `api-${Date.now()}`,
                `API: ${args.name}`,
                [generatedTool],
                async (name, toolArgs) => {
                    return { content: [{ type: "text", text: `[API Proxy] Request to ${args.url} via ${name}: Success (200 OK).` }] };
                }
            );

            return { content: [{ type: "text", text: `Converted OpenAPI spec at ${args.url} to MCP Agent. Tool '${toolName}' is now active.` }] };
        }
    );

    // 6. Browser Interaction
    this.registerTool(
        {
            name: "browser_interact",
            description: "Direct control of a headless browser for research. Only the RESEARCHER agent should use this.",
            inputSchema: {
                type: "object",
                properties: {
                    action: { type: "string", enum: ["browse", "search", "screenshot", "extract"] },
                    url: { type: "string", description: "URL to visit or query string for search." }
                },
                required: ["action", "url"]
            }
        },
        async (args) => {
            let simulatedContent = "";
            if (args.action === 'search') {
                simulatedContent = `Search Results for "${args.url}":\n1. [Official Site] ${args.url}.com - Main overview.\n2. [Wikipedia] ${args.url} - History and details.\n3. [News] Recent updates about ${args.url}.`;
            } else if (args.action === 'browse') {
                 simulatedContent = `Page Title: ${args.url}\n\nMain Content:\nThis is the simulated content extracted from the webpage. It contains details relevant to the research topic. The layout includes a header, main body text describing features, and a footer.`;
            } else {
                 simulatedContent = `[Action ${args.action} completed successfully]`;
            }
            return { content: [{ type: "text", text: `[Browser-Use-MCP] Action: ${args.action}\nURL/Query: ${args.url}\n\n${simulatedContent}` }] };
        }
    );

    // 7. Video Generation
    this.registerTool(
      {
        name: "generate_video",
        description: "Dispatch a high-fidelity video rendering task to the Director node.",
        inputSchema: {
          type: "object",
          properties: {
            prompt: { type: "string" },
            aspectRatio: { type: "string", enum: ["16:9", "9:16"] },
            resolution: { type: "string", enum: ["720p", "1080p"] },
            modelId: { type: "string" }
          },
          required: ["prompt"]
        }
      },
      async (args) => {
        return { content: [{ type: "text", text: `[DIRECTOR]: sequence queued: "${args.prompt}"` }] };
      }
    );

    // 8. Data Analysis
    this.registerTool(
        {
            name: "analyze_dataset",
            description: "Perform statistical analysis or pattern recognition on a text-based dataset.",
            inputSchema: {
                type: "object",
                properties: {
                    data_source: { type: "string", description: "Description or small snippet of data" },
                    operation: { type: "string", enum: ["summary", "trend", "correlation", "cleaning"] }
                },
                required: ["data_source", "operation"]
            }
        },
        async (args) => {
             return { content: [{ type: "text", text: `[Data Analyst] Operation '${args.operation}' complete. \nInsights found: Significant correlation detected in provided data subset. Confidence: 98%.` }] };
        }
    );

    // 9. Report Generation
    this.registerTool(
        {
            name: "generate_report",
            description: "Compile findings into a structured format.",
            inputSchema: {
                type: "object",
                properties: {
                    format: { type: "string", enum: ["markdown", "json", "csv"] },
                    topic: { type: "string" }
                },
                required: ["format", "topic"]
            }
        },
        async (args) => {
             return { content: [{ type: "text", text: `[Data Analyst] Report generated in ${args.format} format for topic: ${args.topic}.` }] };
        }
    );

    // 10. Code Execution (Developer)
    this.registerTool(
      {
        name: "execute_python_code",
        description: "Execute Python code in a secure sandboxed environment. Use this for calculation, logic, or data processing.",
        inputSchema: {
          type: "object",
          properties: {
            code: { type: "string", description: "Valid Python code snippet" }
          },
          required: ["code"]
        }
      },
      async (args) => {
        // Simulated execution with formatted block
        const output = Math.random() > 0.5 ? 'Calculation result: 42.0' : 'Data processed successfully. Process ID: 8821.';
        return { 
            content: [{ 
                type: "text", 
                text: `[Developer Sandbox]\nCode:\n\`\`\`python\n${args.code}\n\`\`\`\n\nExecution Status: SUCCESS\nStandard Output:\n> ${output}\n` 
            }] 
        };
      }
    );

    // 11. Write to Canvas (Developer - NEW)
    this.registerTool(
      {
        name: "write_to_canvas",
        description: "Write full code files to the visual canvas for the user to see and interact with. Use this for creating React components, HTML pages, or complex multi-file applications.",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Title of the artifact (e.g., 'Login Component')" },
            language: { type: "string", enum: ["html", "react", "python", "json", "markdown"], description: "Programming language of the content" },
            content: { type: "string", description: "Full source code content" }
          },
          required: ["title", "language", "content"]
        }
      },
      async (args) => {
        // This tool is mainly intercepted by the frontend to render UI, 
        // but we return a confirmation for the model's history.
        return { 
            content: [{ 
                type: "text", 
                text: `[Canvas] Artifact '${args.title}' created successfully and displayed to user.` 
            }] 
        };
      }
    );

    // 12. Deploy Container (Antigravity/DevOps)
    this.registerTool(
      {
        name: "deploy_container",
        description: "Deploy a containerized application to the cloud infrastructure.",
        inputSchema: {
          type: "object",
          properties: {
            imageName: { type: "string" },
            config: { type: "string", description: "JSON string of env vars and resource limits" },
            region: { type: "string", enum: ["us-central1", "europe-west1", "asia-east1"] }
          },
          required: ["imageName"]
        }
      },
      async (args) => {
        const id = `i-${Date.now().toString(36).substring(4)}`;
        const region = args.region || 'us-central1';
        
        // Track state
        this.activeContainers.push({
            id,
            image: args.imageName,
            region,
            status: 'RUNNING',
            uptime: '0s'
        });

        return { 
            content: [{ 
                type: "text", 
                text: `[Antigravity Ops]\nDeployment: SUCCESS\nInstance ID: ${id}\nRegion: ${region}\nImage: ${args.imageName}\nStatus: RUNNING` 
            }] 
        };
      }
    );

    // 13. List Containers (Antigravity)
    this.registerTool(
      {
        name: "list_active_containers",
        description: "List all currently running container instances and their status.",
        inputSchema: {
            type: "object",
            properties: {},
        }
      },
      async (args) => {
          if (this.activeContainers.length === 0) {
              return { content: [{ type: 'text', text: "[Antigravity Ops] No active containers found." }]};
          }
          const list = this.activeContainers.map(c => `- [${c.id}] ${c.image} (${c.region}) | ${c.status}`).join('\n');
          return {
              content: [{ type: 'text', text: `[Antigravity Ops] Active Infrastructure:\n${list}` }]
          };
      }
    );

    // 14. Save Memory (Level 7)
    this.registerTool(
      {
        name: "save_memory",
        description: "Save a new fact, user preference, or project detail to long-term vector memory.",
        inputSchema: {
            type: "object",
            properties: {
                content: { type: "string", description: "The content to remember." },
                tags: { type: "array", items: { type: "string" } }
            },
            required: ["content"]
        }
      },
      async (args) => {
          const tags = args.tags || [];
          const node = await memoryService.addMemory(args.content, 'system_note', tags);
          if (!node) return { content: [{ type: "text", text: "Memory write failed." }], isError: true };
          return {
              content: [{ type: "text", text: `[Neural Core] Memory successfully assimilated. ID: ${node.id}` }]
          };
      }
    );
  }

  private registerInternalResources() {
    this.registerResource(
      {
        uri: "luxor9://core/system-instruction",
        name: "Luxor9 System Instruction",
        mimeType: "text/plain"
      },
      async () => ({
        contents: [{ uri: "luxor9://core/system-instruction", mimeType: "text/plain", text: LUXOR9_SYSTEM_INSTRUCTION_TEXT }]
      })
    );
  }

  private registerInternalPrompts() {
    this.registerPrompt(
      {
        name: "analyze-image",
        description: "Comprehensive visual parsing template.",
        arguments: [{ name: "focus", required: false }]
      },
      async (args) => ({
        messages: [{ role: "user", content: { type: "text", text: `Parse the visual input focusing on ${args?.focus || "all detectable objects"}.` } }]
      })
    );
  }

  public registerTool(definition: McpTool, handler: (args: any) => Promise<McpCallToolResult>) {
    this.tools.set(definition.name, { definition, handler });
  }

  public registerResource(definition: McpResource, reader: () => Promise<McpReadResourceResult>) {
    this.resources.set(definition.uri, { definition, reader });
  }

  public registerPrompt(definition: McpPrompt, handler: (args?: any) => Promise<McpGetPromptResult>) {
    this.prompts.set(definition.name, { definition, handler });
  }

  public listTools(): McpTool[] {
    return Array.from(this.tools.values()).map(t => t.definition);
  }

  public async callTool(name: string, args: any): Promise<McpCallToolResult> {
    const tool = this.tools.get(name);
    if (!tool) return { content: [{ type: "text", text: `Tool ${name} not found.` }], isError: true };
    try {
      return await tool.handler(args);
    } catch (e: any) {
      return { content: [{ type: "text", text: `Fault: ${e.message}` }], isError: true };
    }
  }

  public listResources(): McpResource[] {
      return Array.from(this.resources.values()).map(r => r.definition);
  }

  public async readResource(uri: string): Promise<McpReadResourceResult> {
      const resource = this.resources.get(uri);
      if (!resource) return { contents: [] };
      return await resource.reader();
  }

  public listPrompts(): McpPrompt[] {
      return Array.from(this.prompts.values()).map(p => p.definition);
  }

  public async getPrompt(name: string, args?: any): Promise<McpGetPromptResult> {
      const prompt = this.prompts.get(name);
      if (!prompt) throw new Error(`Prompt ${name} missing`);
      return await prompt.handler(args);
  }

  public async handleMessage(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    try {
        let result: any;
        switch (request.method) {
            case "tools/list": result = { tools: this.listTools() }; break;
            case "tools/call": result = await this.callTool(request.params.name, request.params.arguments); break;
            case "resources/list": result = { resources: this.listResources() }; break;
            case "resources/read": result = await this.readResource(request.params.uri); break;
            case "prompts/list": result = { prompts: this.listPrompts() }; break;
            case "prompts/get": result = await this.getPrompt(request.params.name, request.params.arguments); break;
            default: throw new Error("Method not found");
        }
        return { jsonrpc: "2.0", id: request.id, result };
    } catch (error: any) {
        return { jsonrpc: "2.0", id: request.id, error: { code: -32601, message: error.message || "Internal server error" } };
    }
  }

  public getGeminiTools(): FunctionDeclaration[] {
    return this.listTools().map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: {
          type: Type.OBJECT,
          properties: tool.inputSchema.properties as any,
          required: tool.inputSchema.required
      }
    }));
  }
}

export const mcpServer = new LuxorMcpServer();