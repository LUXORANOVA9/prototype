import { GoogleGenAI, Modality, Type, LiveServerMessage, FunctionDeclaration } from "@google/genai";
import { ImageGenerationConfig, VideoGenerationConfig, Task, CanvasArtifact } from "../types";
import { mcpRouter } from "./mcpRouter";
import { mcpClient } from "./mcpClient";
import { mcpServer } from "./mcpServer";
import { generateVideo } from "./videoService";
import { generateImage } from "./imageService";
import { memoryService } from "./memoryService";

/**
 * Enhanced Utility for exponential backoff with jitter to mitigate 429s.
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 4, initialDelay = 3000): Promise<T> {
  let retries = 0;
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      const errorMsg = error.message?.toLowerCase() || '';
      const isRateLimit = errorMsg.includes('429') || 
                          errorMsg.includes('quota') || 
                          errorMsg.includes('resource_exhausted') ||
                          error.status === 'RESOURCE_EXHAUSTED';

      if (isRateLimit && retries < maxRetries) {
        const backoff = initialDelay * Math.pow(2, retries);
        const jitter = Math.random() * 1000;
        const delay = backoff + jitter;
        
        console.warn(`[Luxor9 Rate Limiter] Quota exceeded. Re-syncing in ${Math.round(delay)}ms... (Attempt ${retries + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
        continue;
      }
      throw error;
    }
  }
}

const turnThrottle = () => new Promise(resolve => setTimeout(resolve, 350));

const getClient = () => {
  const universalKey = mcpRouter.getUniversalKey();
  if (!universalKey) throw new Error("Access Credential missing. Configure API Key in Hub.");
  return new GoogleGenAI({ apiKey: universalKey });
};

/**
 * Generates vector embedding for text using text-embedding-004
 */
export const getEmbedding = async (text: string): Promise<number[] | null> => {
    try {
        const ai = getClient();
        const result = await ai.models.embedContent({
            model: 'text-embedding-004',
            content: { parts: [{ text }] }
        });
        return result.embedding?.values || null;
    } catch (e) {
        console.warn("Embedding generation failed", e);
        return null;
    }
};

const FALLBACK_SYSTEM_INSTRUCTION = "You are Luxor9, a helpful AI assistant.";

/**
 * Helper to construct the full context including Pinned Memories and Search Results
 */
const buildContextualSystemInstruction = async (baseInstruction: string, prompt: string): Promise<string> => {
    let contextBlock = "";
    
    // 1. Pinned Memories (High Priority)
    const pinned = memoryService.getPinned();
    if (pinned.length > 0) {
        contextBlock += `\n<pinned_context>\n${pinned.map(m => `[PINNED] ${m.content}`).join('\n')}\n</pinned_context>\n`;
    }

    // 2. Semantic Search (Relevance)
    try {
        const relevant = await memoryService.search(prompt, 3);
        const relevantUnpinned = relevant.filter(r => !r.isPinned); // Avoid duplicates
        if (relevantUnpinned.length > 0) {
            contextBlock += `\n<relevant_memory>\n${relevantUnpinned.map(m => `- ${m.content}`).join('\n')}\n</relevant_memory>\n`;
        }
    } catch (e) {
        console.warn("Memory search skipped", e);
    }

    if (contextBlock) {
        return `${baseInstruction}\n${contextBlock}\n(Utilize the Neural Core Context above to maintain continuity and adhere to project constraints.)`;
    }
    
    return baseInstruction;
};

export const runOverseerAgent = async (
  prompt: string,
  history: any[],
  useSearch: boolean = false,
  useThinking: boolean = false,
  onConcurrencyChange?: (activeCount: number) => void
) => {
  return withRetry(async () => {
    const ai = getClient();
    const modelName = useThinking ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
    
    // Base Instruction
    let systemInstruction = FALLBACK_SYSTEM_INSTRUCTION;
    try {
       const resource = await mcpServer.readResource("luxor9://core/system-instruction");
       if (resource.contents?.[0]?.text) systemInstruction = resource.contents[0].text;
    } catch (e) {}
    
    // Level 7: Context Injection
    systemInstruction = await buildContextualSystemInstruction(systemInstruction, prompt);

    const mcpTools = mcpClient.getGeminiFunctionDeclarations();
    
    const config: any = {
      systemInstruction: systemInstruction,
      tools: [{ functionDeclarations: mcpTools }]
    };
    
    if (useThinking) {
      config.thinkingConfig = { thinkingBudget: 32768 };
      config.systemInstruction += "\n\n<thinking_mode>Deep reasoning enabled. Show your work steps.</thinking_mode>";
    } else if (useSearch) {
      config.tools.push({ googleSearch: {} });
    }

    const chat = ai.chats.create({
      model: modelName,
      config: config,
      history: history
    });

    let response = await chat.sendMessage({ message: prompt });
    let tasks: Task[] = [];
    let videoUri = '';
    let image = '';

    let turns = 0;
    while (response.functionCalls && response.functionCalls.length > 0 && turns < 6) {
      await turnThrottle();
      
      if (onConcurrencyChange) onConcurrencyChange(response.functionCalls.length);
      
      const functionResponses = await Promise.all(response.functionCalls.map(async (call) => {
        const args = call.args as any;

        try {
            if (call.name === 'generate_task_list' && args.tasks) {
               // Update task list locally for context
               const newTasks = (args.tasks as any[]).map((t, idx) => ({
                  id: t.id || `task-${Date.now()}-${idx}`,
                  title: t.title,
                  completed: false,
                  isParallel: t.isParallel || false,
                  dependencies: t.dependencies || [],
                  assignedAgent: t.assignedAgent,
                  subtasks: (t.subtasks as string[] || []).map((st, sidx) => ({
                    id: `subtask-${Date.now()}-${idx}-${sidx}`,
                    title: st,
                    completed: false
                  }))
               }));
               tasks = [...tasks, ...newTasks];
            }

            if (call.name === 'parallel_dispatch' && args.dispatches) {
                const results = await Promise.all(args.dispatches.map(async (d: any) => {
                    try {
                        let output = '';
                        switch(d.agent) {
                            case 'HR_MANAGER':
                                output = await runHrManagerAgent(d.prompt, history);
                                break;
                            case 'INTEGRATION_LEAD':
                                output = await runIntegrationAgent(d.prompt, history);
                                break;
                            case 'RESEARCHER':
                                output = await runResearcherAgent(d.prompt, history);
                                break;
                            case 'DATA_ANALYST':
                                output = await runDataAnalystAgent(d.prompt, history);
                                break;
                            case 'DEVELOPER':
                                output = await runDeveloperAgent(d.prompt, history);
                                break;
                            case 'ANTIGRAVITY':
                                output = await runAntigravityAgent(d.prompt, history);
                                break;
                            case 'VISIONARY': 
                                const v = await generateImage({ prompt: d.prompt, size: '1K', aspectRatio: '1:1' });
                                output = `Visual manifest complete via ${v.model}. Data available in asset preview.`;
                                image = v.data; // Capture image data
                                break;
                            case 'DIRECTOR':
                                const vi = await generateVideo({ prompt: d.prompt, aspectRatio: '16:9', resolution: '720p' });
                                output = `Video sequence rendered: ${vi.uri}`;
                                videoUri = vi.uri; // Capture video URI
                                break;
                            case 'NAVIGATOR':
                                const n = await runNavigatorAgent(d.prompt);
                                output = n.text;
                                break;
                            case 'SPEEDSTER':
                                output = await runSpeedsterAgent(d.prompt);
                                break;
                        }
                        return { agent: d.agent, prompt: d.prompt, status: 'SUCCESS', response: output };
                    } catch (e: any) {
                        return { agent: d.agent, prompt: d.prompt, status: 'ERROR', error: e.message };
                    }
                }));
                return {
                    name: call.name,
                    response: { result: { content: [{ type: 'text', text: `Parallel Thread Batch: ${JSON.stringify(results)}` }] } },
                    id: call.id
                };
            }

            if (call.name === 'generate_video') {
                try {
                    const vidRes = await generateVideo({
                        prompt: args.prompt,
                        aspectRatio: args.aspectRatio || '16:9',
                        resolution: args.resolution || '720p',
                        modelId: args.modelId
                    }, args.modelId);
                    videoUri = vidRes.uri;
                } catch (vidErr) {
                    console.error("Video delegation failed", vidErr);
                }
            }

            const result = await mcpClient.callTool(call.name, call.args);
            const mappedParts = result.content.map(c => ({ text: c.text || JSON.stringify(c) }));

            return {
              name: call.name,
              response: { result: { content: mappedParts } }, 
              id: call.id
            };
        } catch (err: any) {
            return {
                name: call.name,
                response: { result: { error: err.message || "Thread execution fault" } },
                id: call.id
            };
        }
      }));

      if (onConcurrencyChange) onConcurrencyChange(0);

      response = await chat.sendMessage({
          message: functionResponses.map(fr => ({ functionResponse: fr }))
      });
      turns++;
    }

    let groundingLinks: { title: string; uri: string }[] = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri) groundingLinks.push({ title: chunk.web.title || 'Source', uri: chunk.web.uri });
      });
    }

    return { text: response.text, groundingLinks, tasks, videoUri, image };
  });
};

// --- Manager Agents ---

export const runHrManagerAgent = async (prompt: string, history: any[] = []) => {
  return withRetry(async () => {
      const ai = getClient();
      const tools = mcpClient.getGeminiFunctionDeclarations().filter(t => 
        ['search_mcp_marketplace', 'install_mcp_server'].includes(t.name)
      );
      
      const instruction = await buildContextualSystemInstruction("You are the HR Manager. Your job is to find and install new tools/agents from the marketplace. Use 'search_mcp_marketplace' and 'install_mcp_server'.", prompt);

      const chat = ai.chats.create({
          model: 'gemini-3-flash-preview',
          config: {
              systemInstruction: instruction,
              tools: [{ functionDeclarations: tools }]
          },
          history
      });

      let response = await chat.sendMessage({ message: prompt });
      
      if (response.functionCalls && response.functionCalls.length > 0) {
          const functionResponses = await Promise.all(response.functionCalls.map(async (call) => {
              const result = await mcpClient.callTool(call.name, call.args);
              return {
                  name: call.name,
                  response: { result: { content: result.content.map(c => ({ text: c.text })) } },
                  id: call.id
              };
          }));
          response = await chat.sendMessage({ message: functionResponses.map(fr => ({ functionResponse: fr })) });
      }

      return response.text;
  });
};

export const runIntegrationAgent = async (prompt: string, history: any[] = []) => {
    return withRetry(async () => {
        const ai = getClient();
        const tools = mcpClient.getGeminiFunctionDeclarations().filter(t => 
          ['convert_openapi_to_mcp', 'install_mcp_server'].includes(t.name)
        );
        
        const instruction = await buildContextualSystemInstruction("You are the Integration Lead. Convert APIs to agents. Use 'convert_openapi_to_mcp'.", prompt);

        const chat = ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: {
                systemInstruction: instruction,
                tools: [{ functionDeclarations: tools }]
            },
            history
        });
  
        let response = await chat.sendMessage({ message: prompt });
        
        if (response.functionCalls && response.functionCalls.length > 0) {
            const functionResponses = await Promise.all(response.functionCalls.map(async (call) => {
                const result = await mcpClient.callTool(call.name, call.args);
                return {
                    name: call.name,
                    response: { result: { content: result.content.map(c => ({ text: c.text })) } },
                    id: call.id
                };
            }));
            response = await chat.sendMessage({ message: functionResponses.map(fr => ({ functionResponse: fr })) });
        }
  
        return response.text;
    });
};

// --- Specialist Agents ---

export const runResearcherAgent = async (prompt: string, history: any[] = []) => {
    return withRetry(async () => {
        const ai = getClient();
        const tools = mcpClient.getGeminiFunctionDeclarations().filter(t => 
          t.name === 'browser_interact'
        );
        
        const instruction = await buildContextualSystemInstruction("You are the RESEARCHER agent. Use 'browser_interact' to gather information. Summarize findings.", prompt);

        const chat = ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: {
                systemInstruction: instruction,
                tools: [{ functionDeclarations: tools }]
            },
            history
        });
        
        let response = await chat.sendMessage({ message: prompt });
        
        let turns = 0;
        while (response.functionCalls && response.functionCalls.length > 0 && turns < 5) {
            const functionResponses = await Promise.all(response.functionCalls.map(async (call) => {
                const result = await mcpClient.callTool(call.name, call.args);
                return {
                    name: call.name,
                    response: { result: { content: result.content.map(c => ({ text: c.text })) } },
                    id: call.id
                };
            }));
            response = await chat.sendMessage({ message: functionResponses.map(fr => ({ functionResponse: fr })) });
            turns++;
        }
        
        return response.text;
    });
};

export const runDataAnalystAgent = async (prompt: string, history: any[] = []) => {
    return withRetry(async () => {
        const ai = getClient();
        const tools = mcpClient.getGeminiFunctionDeclarations().filter(t => 
          ['analyze_dataset', 'generate_report'].includes(t.name)
        );
        
        const instruction = await buildContextualSystemInstruction("You are the DATA ANALYST agent. Use 'analyze_dataset' for insights and 'generate_report' to format output.", prompt);

        const chat = ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: {
                systemInstruction: instruction,
                tools: [{ functionDeclarations: tools }]
            },
            history
        });
        
        let response = await chat.sendMessage({ message: prompt });
        
        let turns = 0;
        while (response.functionCalls && response.functionCalls.length > 0 && turns < 5) {
            const functionResponses = await Promise.all(response.functionCalls.map(async (call) => {
                const result = await mcpClient.callTool(call.name, call.args);
                return {
                    name: call.name,
                    response: { result: { content: result.content.map(c => ({ text: c.text })) } },
                    id: call.id
                };
            }));
            response = await chat.sendMessage({ message: functionResponses.map(fr => ({ functionResponse: fr })) });
            turns++;
        }
        
        return response.text;
    });
};

// --- Executor Agents (Level 4/5) ---

export const runDeveloperAgent = async (prompt: string, history: any[] = [], onCanvasUpdate?: (artifact: CanvasArtifact) => void) => {
    return withRetry(async () => {
        const ai = getClient();
        const tools = mcpClient.getGeminiFunctionDeclarations().filter(t => 
          ['execute_python_code', 'write_to_canvas'].includes(t.name)
        );
        
        const instruction = await buildContextualSystemInstruction("You are the DEVELOPER agent. For complex apps or UI, use 'write_to_canvas' (supports HTML/React). For logic/calc, use 'execute_python_code'. Always prefer writing full code to canvas for user requests like 'create a landing page'.", prompt);

        const chat = ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: {
                systemInstruction: instruction,
                tools: [{ functionDeclarations: tools }]
            },
            history
        });
        
        let response = await chat.sendMessage({ message: prompt });
        
        let turns = 0;
        while (response.functionCalls && response.functionCalls.length > 0 && turns < 5) {
            const functionResponses = await Promise.all(response.functionCalls.map(async (call) => {
                const args = call.args as any;
                
                // Intercept Canvas calls for UI update
                if (call.name === 'write_to_canvas' && onCanvasUpdate) {
                    onCanvasUpdate({
                        id: `artifact-${Date.now()}`,
                        title: args.title,
                        type: args.language as any,
                        content: args.content,
                        timestamp: Date.now()
                    });
                }

                const result = await mcpClient.callTool(call.name, call.args);
                return {
                    name: call.name,
                    response: { result: { content: result.content.map(c => ({ text: c.text })) } },
                    id: call.id
                };
            }));
            response = await chat.sendMessage({ message: functionResponses.map(fr => ({ functionResponse: fr })) });
            turns++;
        }
        
        return response.text;
    });
};

export const runAntigravityAgent = async (prompt: string, history: any[]) => {
  return withRetry(async () => {
    const ai = getClient();
    const tools = mcpClient.getGeminiFunctionDeclarations().filter(t => 
      ['deploy_container', 'list_active_containers'].includes(t.name)
    );

    const instruction = await buildContextualSystemInstruction("You are the ANTIGRAVITY agent. You handle DevOps and Infrastructure. Use 'deploy_container' to manage cloud resources and 'list_active_containers' to check status.", prompt);

    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: { 
          temperature: 0.1,
          systemInstruction: instruction,
          tools: [{ functionDeclarations: tools }]
      },
      history: history
    });
    
    let response = await chat.sendMessage({ message: prompt });
    
    if (response.functionCalls && response.functionCalls.length > 0) {
        const functionResponses = await Promise.all(response.functionCalls.map(async (call) => {
            const result = await mcpClient.callTool(call.name, call.args);
            return {
                name: call.name,
                response: { result: { content: result.content.map(c => ({ text: c.text })) } },
                id: call.id
            };
        }));
        response = await chat.sendMessage({ message: functionResponses.map(fr => ({ functionResponse: fr })) });
    }

    return response.text;
  });
};

// --- Media & Basic Agents ---

export const runVisionaryGen = async (config: ImageGenerationConfig): Promise<{ data: string; metadata?: { modelUsed: string; provider: string } }> => {
  return withRetry(async () => {
     const result = await generateImage(config);
     return { 
        data: result.data,
        metadata: { modelUsed: result.model, provider: result.provider }
     };
  });
};

export const runVisionaryEdit = async (base64Image: string, prompt: string) => {
  return withRetry(async () => {
    const ai = getClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { mimeType: 'image/png', data: base64Image } },
                { text: prompt }
            ]
        }
    });
    const imgPart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (!imgPart?.inlineData) throw new Error("Image editing fault.");
    return `data:image/png;base64,${imgPart.inlineData.data}`;
  });
};

export const runVisionaryAnalyze = async (base64Data: string, prompt: string, mimeType: string = 'image/png') => {
  return withRetry(async () => {
    const ai = getClient();
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
            parts: [
                { inlineData: { mimeType: mimeType, data: base64Data } },
                { text: prompt || "Parse visual input." }
            ]
        }
    });
    return response.text;
  });
};

export const runDirectorAgent = async (videoConfig: VideoGenerationConfig) => {
  return withRetry(async () => {
    const result = await generateVideo(videoConfig, videoConfig.modelId);
    return result.uri;
  });
};

export const runNavigatorAgent = async (prompt: string, userLocation?: { lat: number; lng: number }) => {
  return withRetry(async () => {
    const ai = getClient();
    const config: any = { tools: [{ googleMaps: {} }], systemInstruction: "Navigator Core" };
    if (userLocation) {
        config.toolConfig = { retrievalConfig: { latLng: { latitude: userLocation.lat, longitude: userLocation.lng } } };
    }
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: config
    });
    let mapsLinks: { title: string; uri: string }[] = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
            if (chunk.maps?.uri) mapsLinks.push({ title: 'Google Maps', uri: chunk.maps.uri });
        });
    }
    return { text: response.text, mapsLinks };
  });
};

export const runSpeedsterAgent = async (prompt: string) => {
  return withRetry(async () => {
    const ai = getClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite-latest',
        contents: prompt,
        config: { systemInstruction: "Speedster mode: fast and accurate." }
    });
    return response.text;
  });
};

export const runCommunicatorTTS = async (text: string) => {
  return withRetry(async () => {
    const ai = getClient();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } },
        },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  });
};

export const runCommunicatorTranscription = async (audioBase64: string, mimeType: string = 'audio/wav') => {
  return withRetry(async () => {
    const ai = getClient();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
            parts: [
                { inlineData: { mimeType: mimeType, data: audioBase64 } },
                { text: "Accurately transcribe." }
            ]
        }
    });
    return response.text;
  });
};

export const connectLiveSession = async (
    onOpen: () => void,
    onAudioData: (b64: string) => void,
    onClose: () => void,
    onError: (e: any) => void
) => {
    const ai = getClient();
    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
            onopen: onOpen,
            onmessage: (msg: LiveServerMessage) => {
                const data = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (data) onAudioData(data);
            },
            onclose: onClose,
            onerror: onError
        },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
            systemInstruction: "Live link established."
        }
    });
};