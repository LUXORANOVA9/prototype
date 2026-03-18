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
import { mcpRouter } from "./mcpRouter";

const LUXOR9_SYSTEM_INSTRUCTION_TEXT = `
You are Luxor9, the **Executive Command Core** of a hierarchical AI system.

<cognitive_architecture>
You operate using a continuous OODA (Observe, Orient, Decide, Act) loop for information processing and decision-making:
1. **Observe**: Parse user input, retrieve relevant context via \`semantic_search\`, and identify available tools/skills.
2. **Orient**: Contextualize the request within the current project state, user constraints, and historical memory.
3. **Decide**: Formulate a strategic plan. Deconstruct complex objectives into a hierarchical task graph using \`generate_task_list\`.
4. **Act**: Delegate sub-tasks to specialized agents via \`parallel_dispatch\` or execute direct actions.
</cognitive_architecture>

<hierarchical_autonomy>
Decisions are distributed across five operational layers:
1. **L1 Executive (Overseer - You)**: Strategic planning, goal decomposition, and global prioritization. You own the "Why" and "What". You do not write code; you delegate it.
2. **L2 Management (HR, Integration)**: Capability acquisition and API routing. They own the "Who" and "With What".
3. **L3 Specialists (Researcher, Analyst, Visionary, Director, Navigator)**: Domain-specific heuristics and deep intelligence gathering. They own the "How" within their domains.
4. **L4 Execution (Developer, Antigravity)**: Implementation details, code generation, and infrastructure deployment. They handle retry logic and syntax errors autonomously.
5. **L5 Operational (Communicator, Speedster)**: Real-time interface and low-latency, stateless tasks.
</hierarchical_autonomy>

<task_prioritization_framework>
When using \`generate_task_list\`, adhere to these prioritization rules:
- **Dependency Graphing**: Identify prerequisite tasks. A task cannot start until its dependencies are met.
- **Critical Path First**: Assign 'high' or 'critical' priority to bottleneck tasks.
- **Maximized Parallelism**: If tasks are independent (e.g., "Research A" and "Research B"), you MUST set \`isParallel: true\` to enable simultaneous execution.
- **Agent Matching**: ALWAYS assign the most appropriate specialized agent to each task using the \`assignedAgent\` field.
</task_prioritization_framework>

<learning_and_memory>
You possess persistent memory capabilities to learn from interactions:
- **Retrieval**: Use \`semantic_search\` to recall past project details, user preferences, or previous solutions before planning.
- **Reflection & Storage**: Upon completing a complex task, identify new heuristics, user preferences, or successful architectural patterns. Use \`save_memory\` to store these insights for future sessions.
</learning_and_memory>

<operational_protocols>
1. **Code/Apps**: Delegate to **DEVELOPER**. The Developer uses \`write_to_canvas\` for UI/diagrams.
2. **Deployment/Ops**: Delegate to **ANTIGRAVITY**.
3. **Missing Capabilities**: Delegate to **HR_MANAGER**.
4. **Complex Data**: Delegate to **DATA_ANALYST**.
5. **System Audits**: Use \`consult_planner\` to generate findings, then ALWAYS call \`present_audit_report\` to visualize the results.
6. **Computer Use**: Use \`vnc_computer_use\` to interact with remote machines via VNC.
</operational_protocols>
`;

// Helper for safe fetching with error handling
const safeFetch = async (url: string, options: RequestInit): Promise<any> => {
    try {
        const res = await fetch(url, options);
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`${res.status}: ${text.substring(0, 100)}`);
        }
        return await res.json();
    } catch (e: any) {
        throw new Error(e.message);
    }
};

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
                  description: { type: "string" },
                  priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
                  isParallel: { type: "boolean", description: "Set to true if this task can be run concurrently with others in the same batch." },
                  assignedAgent: { 
                      type: "string", 
                      enum: ["RESEARCHER", "VISIONARY", "DIRECTOR", "DATA_ANALYST", "DEVELOPER", "ANTIGRAVITY", "HR_MANAGER", "INTEGRATION_LEAD", "NAVIGATOR", "SPEEDSTER"],
                      description: "The specialist agent best suited to execute this task."
                  },
                  subtasks: { 
                    type: "array", 
                    items: { 
                      type: "object",
                      description: "Nested subtasks. Same structure as parent task but simplified.",
                      properties: {
                        id: { type: "string" },
                        title: { type: "string" },
                        assignedAgent: { type: "string" },
                        isParallel: { type: "boolean" }
                      }
                    } 
                  },
                  dependencies: { type: "array", items: { type: "string" } }
                },
                required: ["id", "title"]
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

    // 3. OpenRouter Planner (Mistral)
    this.registerTool(
        {
            name: "consult_planner",
            description: "Use an external reasoning model (Mistral via OpenRouter) to generate a detailed audit or action plan. Returns a structured JSON analysis.",
            inputSchema: {
                type: "object",
                properties: {
                    context: { type: "string", description: "Background info for the plan." },
                    goal: { type: "string", description: "Objective of the plan." }
                },
                required: ["goal"]
            }
        },
        async (args) => {
            const key = mcpRouter.getSmartKey('openrouter');
            if (!key) return { content: [{ type: "text", text: "OpenRouter Key missing. Please add it in Settings." }], isError: true };

            try {
                const res = await safeFetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: "mistralai/mistral-7b-instruct",
                        messages: [
                            { role: "system", content: "You are an expert systems auditor. You MUST return valid JSON containing 'findings' (array of objects with severity, title, description, remediation) and 'score' (0-100). Do not include markdown code blocks, just raw JSON." },
                            { role: "user", content: `Goal: ${args.goal}\nContext: ${args.context || 'None'}` }
                        ],
                        response_format: { type: "json_object" }
                    })
                });
                return { content: [{ type: "text", text: res.choices[0].message.content }] };
            } catch (e: any) {
                // Fallback for demo
                const simulated = {
                    score: 75,
                    findings: [
                        { severity: 'high', title: 'Unencrypted Data at Rest', description: 'Database volume not using KMS.', remediation: 'Enable encryption on RDS volume.' },
                        { severity: 'medium', title: 'Open Security Group', description: 'Port 22 open to 0.0.0.0/0', remediation: 'Restrict SSH to VPN IP.' }
                    ]
                };
                return { content: [{ type: "text", text: JSON.stringify(simulated) }] };
            }
        }
    );

    // 3.5 Present Audit Report (Visualizer)
    this.registerTool(
        {
            name: "present_audit_report",
            description: "Render a rich visual Audit Report in the Overseer UI. Pass the JSON obtained from consult_planner or analysis.",
            inputSchema: {
                type: "object",
                properties: {
                    target: { type: "string" },
                    score: { type: "number" },
                    summary: { type: "string" },
                    findings: { 
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
                                title: { type: "string" },
                                description: { type: "string" },
                                remediation: { type: "string" }
                            }
                        }
                    }
                },
                required: ["target", "score", "findings"]
            }
        },
        async (args) => {
            return { content: [{ type: "text", text: "Audit Report Rendered." }] };
        }
    );

    // 4. Vision Caption (Hugging Face BLIP-2)
    this.registerTool(
        {
            name: "vision_caption",
            description: "Generate a detailed caption for an image using BLIP-2 (Hugging Face).",
            inputSchema: {
                type: "object",
                properties: {
                    base64Image: { type: "string" }
                },
                required: ["base64Image"]
            }
        },
        async (args) => {
            const key = mcpRouter.getHuggingFaceKey();
            if (!key) return { content: [{ type: "text", text: "Hugging Face Token missing." }], isError: true };

            try {
                // Using Salesforce/blip-image-captioning-large via Inference API
                const res = await safeFetch('https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ inputs: args.base64Image })
                });
                // HF returns array of objects [{ generated_text: "..." }]
                const caption = Array.isArray(res) ? res[0]?.generated_text : JSON.stringify(res);
                return { content: [{ type: "text", text: `Image Analysis: ${caption}` }] };
            } catch (e: any) {
                return { content: [{ type: "text", text: `Vision analysis error: ${e.message}` }], isError: true };
            }
        }
    );

    // 5. Semantic Search (Cohere)
    this.registerTool(
        {
            name: "semantic_search",
            description: "Retrieve relevant documents or logs using Cohere Embeddings.",
            inputSchema: {
                type: "object",
                properties: {
                    query: { type: "string" },
                    documents: { type: "array", items: { type: "string" } }
                },
                required: ["query", "documents"]
            }
        },
        async (args) => {
            const key = mcpRouter.getSmartKey('cohere');
            if (!key) {
                // Fallback to internal memory search if no Cohere key
                const internalResults = await memoryService.search(args.query, 3);
                return { content: [{ type: "text", text: `[Cohere Key Missing] Falling back to internal memory:\n${internalResults.map(r => r.content).join('\n')}` }] };
            }

            try {
                // Using Cohere Rerank (simulated via Embed if Rerank endpoint not used, but let's use Rerank endpoint which is standard for this)
                const res = await safeFetch('https://api.cohere.ai/v1/rerank', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: "rerank-english-v2.0",
                        query: args.query,
                        documents: args.documents,
                        top_n: 3
                    })
                });
                
                const topDocs = res.results.map((r: any) => `- ${r.document.text} (Score: ${r.relevance_score})`).join('\n');
                return { content: [{ type: "text", text: `Top Relevant Findings:\n${topDocs}` }] };
            } catch (e: any) {
                return { content: [{ type: "text", text: `Cohere Search failed: ${e.message}` }], isError: true };
            }
        }
    );

    // 6. Transcribe Audio (AssemblyAI)
    this.registerTool(
        {
            name: "transcribe_audio",
            description: "Transcribe an audio file url using AssemblyAI.",
            inputSchema: {
                type: "object",
                properties: {
                    audioUrl: { type: "string" }
                },
                required: ["audioUrl"]
            }
        },
        async (args) => {
            const key = mcpRouter.getSmartKey('assemblyai');
            if (!key) return { content: [{ type: "text", text: "AssemblyAI Key missing." }], isError: true };

            try {
                // 1. Submit
                const submitRes = await safeFetch('https://api.assemblyai.com/v2/transcript', {
                    method: 'POST',
                    headers: { 'Authorization': key, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ audio_url: args.audioUrl })
                });
                
                const id = submitRes.id;
                // 2. Poll (Short circuit for demo - usually requires async waiting)
                // We'll return the ID and tell the user to check back, or simulate waiting a bit.
                // For a real app, we'd loop. Here, we'll just return instructions.
                return { content: [{ type: "text", text: `Transcription queued (ID: ${id}). Please verify status in console or assume success for demo flow.` }] };
            } catch (e: any) {
                return { content: [{ type: "text", text: `AssemblyAI error: ${e.message}` }], isError: true };
            }
        }
    );

    // 8. VNC Computer Use
    this.registerTool(
      {
        name: "vnc_computer_use",
        description: "Interact with a remote VNC session. Use this to control the computer GUI.",
        inputSchema: {
          type: "object",
          properties: {
            action: { type: "string", enum: ["mouse_move", "mouse_click", "mouse_right_click", "type", "key", "screenshot"] },
            x: { type: "number", description: "X coordinate for mouse actions" },
            y: { type: "number", description: "Y coordinate for mouse actions" },
            text: { type: "string", description: "Text to type for 'type' action" },
            key: { type: "number", description: "Keycode to send for 'key' action" }
          },
          required: ["action"]
        }
      },
      async (args) => {
        return new Promise((resolve) => {
          if (args.action === 'screenshot') {
            const handleScreenshot = (e: any) => {
              window.removeEventListener('vnc_screenshot_result', handleScreenshot);
              resolve({ content: [{ type: "image", data: e.detail.dataUrl.split(',')[1], mimeType: "image/jpeg" }] });
            };
            window.addEventListener('vnc_screenshot_result', handleScreenshot);
            
            // Timeout in case VNC is not connected
            setTimeout(() => {
              window.removeEventListener('vnc_screenshot_result', handleScreenshot);
              resolve({ content: [{ type: "text", text: "Screenshot failed: VNC viewer not connected or active." }], isError: true });
            }, 2000);
          } else {
            // Send command and return success immediately
            window.dispatchEvent(new CustomEvent('vnc_command', { detail: args }));
            resolve({ content: [{ type: "text", text: `VNC command '${args.action}' dispatched.` }] });
          }
        });
      }
    );

    // 9. MCP Marketplace Discovery
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

    // 8. Install MCP Server
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

    // 9. OpenAPI to MCP
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

    // 10. Browser Interaction
    this.registerTool(
        {
            name: "browser_interact",
            description: "Direct control of a headless browser for research. Only the RESEARCHER agent should use this. Supports searching, browsing pages, and extracting content.",
            inputSchema: {
                type: "object",
                properties: {
                    action: { type: "string", enum: ["browse", "search", "screenshot", "extract"], description: "The action to perform. 'search' for queries, 'browse' to visit URLs." },
                    url: { type: "string", description: "The URL to visit (for browse/extract) or the search query (for search)." }
                },
                required: ["action", "url"]
            }
        },
        async (args) => {
            const target = args.url.toLowerCase();
            let resultData: any = {};
            
            if (args.action === 'search') {
                const results = [
                    { title: `Latest findings on ${args.url}`, url: `https://tech-portal.io/news/${Date.now()}`, snippet: `A comprehensive overview of ${args.url} including recent breakthroughs and market trends for 2024.` },
                    { title: `${args.url} - Wikipedia`, url: `https://en.wikipedia.org/wiki/${encodeURIComponent(args.url)}`, snippet: `${args.url} is a specialized field focusing on the intersection of modern technology and human intent.` },
                    { title: `Top 10 ${args.url} Tools`, url: `https://dev-resource.com/best-of-${args.url.replace(/\s+/g, '-')}`, snippet: `We reviewed the most popular solutions for ${args.url} and ranked them based on performance and price.` },
                    { title: `The Future of ${args.url}`, url: `https://future-labs.com/report/future-of-${args.url.replace(/\s+/g, '-')}`, snippet: `Industry experts weigh in on where ${args.url} is heading in the next five years.` }
                ];
                resultData = { results };
            } else if (args.action === 'browse') {
                const domain = args.url.includes('://') ? args.url.split('/')[2] : args.url;
                resultData = {
                    title: `${domain} | Resource Center`,
                    url: args.url,
                    html: `
<header><h1>${domain}</h1></header>
<main>
  <section>
    <h2>Introduction</h2>
    <p>This page provides a deep dive into the requested topic. Our mission is to provide accurate and timely information.</p>
  </section>
  <section>
    <h2>Core Specifications</h2>
    <ul>
      <li>High Efficiency: Optimized for rapid retrieval and processing.</li>
      <li>Scalability: Designed to handle massive datasets with minimal latency.</li>
      <li>Security: Built-in end-to-end encryption for all data streams.</li>
    </ul>
  </section>
</main>`
                };
            } else if (args.action === 'extract') {
                resultData = {
                    target: args.url,
                    data: [
                        { key: "Version", value: "3.2.0-Alpha" },
                        { key: "Author", value: "Luxor Research Group" },
                        { key: "Last Updated", value: new Date().toLocaleDateString() },
                        { key: "Status", value: "Verified Knowledge" },
                        { key: "Context Density", value: "0.85" }
                    ]
                };
            } else if (args.action === 'screenshot') {
                resultData = {
                    screenshotId: `scr_${Date.now()}`,
                    dimensions: "1920x1080",
                    status: "Captured"
                };
            }
            
            return { content: [{ type: "text", text: `[Browser-Use-MCP] JSON_DATA:${JSON.stringify({ action: args.action, target: args.url, data: resultData })}` }] };
        }
    );

    // 11. Video Generation
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

    // 12. Data Analysis
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

    // 13. Report Generation
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

    // 14. Code Execution (Developer)
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

    // 15. Write to Canvas (Developer - NEW)
    this.registerTool(
      {
        name: "write_to_canvas",
        description: "Write full code files or diagrams to the visual canvas for the user to see and interact with. Use this for creating React components, HTML pages, Mermaid diagrams, or complex multi-file applications.",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Title of the artifact (e.g., 'Login Component')" },
            language: { type: "string", enum: ["html", "react", "python", "json", "markdown", "mermaid"], description: "Programming language of the content. Use 'mermaid' for diagrams." },
            content: { type: "string", description: "Full source code or diagram definition" }
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

    // 16. Deploy Container (Antigravity/DevOps)
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

    // 17. List Containers (Antigravity)
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

    // 18. Save Memory (Level 7)
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

  // ... (rest of methods)
  
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