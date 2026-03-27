import React, { useState, useRef, useEffect, useTransition } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AgentType, Message, ImageGenerationConfig, VideoGenerationConfig, Task, InputAsset, CanvasArtifact, AuditReport } from '../types';
import { 
  runOverseerAgent, 
  runNavigatorAgent, 
  runSpeedsterAgent, 
  runCommunicatorTTS, 
  runVisionaryGen, 
  runVisionaryEdit, 
  runCommunicatorTranscription, 
  runAntigravityAgent, 
  runResearcherAgent, 
  runHrManagerAgent, 
  runIntegrationAgent, 
  runDataAnalystAgent, 
  runDeveloperAgent,
  runDirectorAgent,
  runAiEmployeeAgent
} from '../services/geminiService';
import { generateVideo, VIDEO_MODELS } from '../services/videoService';
import { evaluateResponse } from '../utils/antiPatterns';
import AntiPatternsWorker from '../utils/antiPatternsWorker?worker';
import { mapMessagesToHistory } from '../utils/geminiHelpers';
import { ChatMessage } from './ChatMessage';
import { 
  Send, 
  Plus, 
  Image as ImageIcon, 
  Video, 
  Mic, 
  MicOff,
  StopCircle,
  Sparkles,
  Terminal,
  Code2,
  Box,
  Monitor,
  Layout,
  ChevronRight,
  History,
  Settings,
  Menu,
  X,
  ArrowDown,
  ArrowRight,
  Paperclip,
  Clapperboard,
  Square,
  Activity,
  ShieldCheck,
  Smartphone,
  MonitorPlay,
  Code,
  Layers,
  Network,
  Search,
  BrainCircuit,
  Loader2,
  Cpu,
  Zap,
  Palette,
  Globe,
  Database,
  Target,
  ChevronDown,
  Film,
  Trash2,
  Users,
  Bot
} from 'lucide-react';
import { LiveInterface } from './LiveInterface';
import { LivePreview } from './LivePreview';
import { mcpRouter } from '../services/mcpRouter';
import { memoryService } from '../services/memoryService';
import { telemetryService } from '../services/telemetryService';
import { CanvasPanel } from './CanvasPanel';
import { NeuralCore } from './NeuralCore';
import { AgentSandbox } from './AgentSandbox';
import { VncViewer } from './VncViewer';

const STARTER_PROMPTS: Partial<Record<AgentType, { label: string; prompt: string; icon: any }[]>> = {
    [AgentType.OVERSEER]: [
      { label: "Hierarchical Delegation", prompt: "I need to build a complex web application. Please coordinate with the Developer and Visionary agents to create a plan and execute it.", icon: Network },
      { label: "Project Architect", prompt: "Create a comprehensive architectural plan for a scalable SaaS platform.", icon: Layers },
      { label: "Strategic Decomposition", prompt: "Break down the goal of 'Launching a successful AI startup' into actionable phases.", icon: Network },
      { label: "System Audit", prompt: "Run a full system audit on the 'payments-service'. Use consult_planner to generate the audit steps first.", icon: ShieldCheck }
    ],
    [AgentType.DEVELOPER]: [
      { label: "React Component", prompt: "Write a modern, responsive React component for a dashboard analytics card using Tailwind CSS.", icon: Code },
      { label: "Flutter UI", prompt: "Create a beautiful Flutter UI for a smart home dashboard. Use modern Material 3 design principles.", icon: Smartphone },
      { label: "System Diagram", prompt: "Create a Mermaid.js flowchart visualizing a microservices architecture with Gateway, Auth, and Database nodes.", icon: Network },
      { label: "Canvas UI", prompt: "Use the write_to_canvas tool to build a landing page for a coffee shop.", icon: MonitorPlay }
    ],
    [AgentType.VISIONARY]: [
      { label: "Cyberpunk City", prompt: "Generate a high-fidelity image of a futuristic cyberpunk city with neon lights and rain.", icon: Sparkles },
      { label: "Logo Design", prompt: "Create a minimalist logo concept for a tech company named 'Nexus'.", icon: Palette },
      { label: "Surreal Landscape", prompt: "A dreamlike landscape with floating islands and purple clouds.", icon: ImageIcon }
    ],
    [AgentType.DIRECTOR]: [
      { label: "Cinematic Narrative", prompt: "Elevate a simple story about a morning coffee into a breathtaking, profoundly moving cinematic exploration.", icon: Film },
      { label: "Cinematic Trailer", prompt: "A cinematic drone shot of a futuristic metropolis at sunset, neon lights reflecting on wet pavement, 4k, high detail.", icon: Film },
      { label: "Character Motion", prompt: "A cyberpunk character walking through a busy market, detailed facial features, volumetric lighting.", icon: Clapperboard },
      { label: "Abstract Motion", prompt: "Swirling liquid metal forming complex geometric shapes, smooth motion, 60fps.", icon: Activity }
    ],
    [AgentType.INTEGRATION_LEAD]: [
      { label: "Composio Setup", prompt: "Help me set up a Composio integration with GitHub and Slack. I want to automate PR notifications.", icon: Network },
      { label: "OAuth Flow", prompt: "Explain how to implement a secure OAuth2 flow using Composio for a Notion integration.", icon: ShieldCheck },
      { label: "Tool Discovery", prompt: "List all available tools in the 'gmail' toolkit via Composio and show how to use them.", icon: Search }
    ],
    [AgentType.RESEARCHER]: [
      { label: "Market Research", prompt: "Research the latest trends in Generative AI for 2024 and summarize key players.", icon: Globe },
      { label: "Tech Deep Dive", prompt: "Explain the differences between Transformer architecture and SSMs (State Space Models).", icon: Search },
      { label: "Competitor Analysis", prompt: "Find and analyze top 3 competitors in the project management software space.", icon: Target }
    ],
    [AgentType.AI_EMPLOYEE]: [
      { label: "Onboarding", prompt: "Hi Nova, I'm a new hire. Can you help me get started with the company's workflows?", icon: Users },
      { label: "Task Management", prompt: "I'm feeling overwhelmed with my tasks today. Can you help me prioritize and manage them?", icon: Activity },
      { label: "Project Update", prompt: "We just hit a major milestone on the Phoenix project! Let's celebrate and plan the next steps.", icon: Sparkles }
    ],
    [AgentType.BRAND_ARCHITECT]: [
      { label: "Slide Architect", prompt: "Generate Slide 4 (Factory) using Luxor9 brand voice.", icon: Sparkles },
      { label: "Tagline Generator", prompt: "Generate 10 brand taglines for Luxor9.", icon: Target },
      { label: "Hero Copy", prompt: "Generate homepage hero section for Luxor9.", icon: Globe },
      { label: "Pitch Script", prompt: "Generate 1-minute pitch script for Luxor9.", icon: Film }
    ]
};

// Fallback for agents without specific starters
const GENERIC_STARTERS = [
    { label: "Identify Capability", prompt: "What are your core capabilities and how can you assist me?", icon: Cpu },
    { label: "Execute Task", prompt: "I have a complex task that requires multiple steps. Can you help me plan it?", icon: Zap },
    { label: "System Status", prompt: "Run a diagnostic check on all connected MCP nodes.", icon: Activity }
];

const getCurrentPosition = (): Promise<{lat: number, lng: number} | undefined> => {
    return new Promise((resolve) => {
        if (!navigator.geolocation) resolve(undefined);
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => resolve(undefined),
            { timeout: 5000 }
        );
    });
};

export const AgentWorkstation: React.FC<{ agent: AgentType; onOpenMcp: () => void }> = ({ agent, onOpenMcp }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPending, startTransition] = useTransition();
  
  const dispatchMessages = (action: React.SetStateAction<Message[]>) => {
    startTransition(() => {
      setMessages(action);
    });
  };

  // Refactored Loading State for Parallelism
  const [isChatGenerating, setIsChatGenerating] = useState(false);
  const [executingTaskIds, setExecutingTaskIds] = useState<Set<string>>(new Set());
  
  const isBusy = isChatGenerating || executingTaskIds.size > 0 || isPending;

  const [attachedAsset, setAttachedAsset] = useState<string | null>(null);
  const [assetType, setAssetType] = useState<'image' | 'video' | null>(null);
  const [assetMimeType, setAssetMimeType] = useState<string>('');
  
  // Voice Input
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandFilter, setCommandFilter] = useState('');

  const COMMANDS = [
    { id: 'clear', label: 'Clear History', icon: Trash2, action: () => dispatchMessages([]) },
    { id: 'vnc', label: 'Toggle VNC', icon: Monitor, action: () => setShowVncViewer(!showVncViewer) },
    { id: 'core', label: 'Toggle Neural Core', icon: Cpu, action: () => setShowNeuralCore(!showNeuralCore) },
    { id: 'canvas', label: 'Toggle Canvas', icon: MonitorPlay, action: () => setShowCanvas(!showCanvas) },
    { id: 'mcp', label: 'Open MCP Settings', icon: Settings, action: onOpenMcp },
  ];

  const filteredCommands = COMMANDS.filter(c => c.label.toLowerCase().includes(commandFilter.toLowerCase()));

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    if (val.startsWith('/')) {
      setShowCommandPalette(true);
      setCommandFilter(val.slice(1));
    } else {
      setShowCommandPalette(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCommandSelect = (cmd: typeof COMMANDS[0]) => {
    cmd.action();
    setInput('');
    setShowCommandPalette(false);
    addActivity(`Command: ${cmd.label}`);
  };

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Panels
  const [activeArtifact, setActiveArtifact] = useState<CanvasArtifact | null>(null);
  const [showCanvas, setShowCanvas] = useState(false);
  const [showNeuralCore, setShowNeuralCore] = useState(false);
  const [showVncViewer, setShowVncViewer] = useState(false);
  const [showAgentSandbox, setShowAgentSandbox] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(false);
  
  const [concurrencyCount, setConcurrencyCount] = useState(0);
  const [activityLog, setActivityLog] = useState<string[]>([]);

  const addActivity = (msg: string) => {
    setActivityLog(prev => [msg, ...prev].slice(0, 5));
  };

  // Callbacks passed to runOverseerAgent
  const handleCanvasUpdate = (artifact: CanvasArtifact) => {
      setActiveArtifact(artifact);
      setShowCanvas(true);
      if (window.innerWidth < 768) setShowNeuralCore(false);
  };

  const handleAuditReport = (report: AuditReport) => {
      // Handled in message processing loop
  };

  const [imageConfig, setImageConfig] = useState<ImageGenerationConfig>({ prompt: '', size: '1K', aspectRatio: '1:1', provider: 'auto' });
  const [videoConfig, setVideoConfig] = useState<VideoGenerationConfig>({ prompt: '', aspectRatio: '16:9', resolution: '720p', modelId: VIDEO_MODELS[0].id });
  
  const [useThinking, setUseThinking] = useState(false);
  const [useGoogleSearch, setUseGoogleSearch] = useState(false);
  const [latestAudio, setLatestAudio] = useState<string | undefined>();

  const assetInputRef = useRef<HTMLInputElement>(null);
  const msgEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        setShowScrollButton(scrollHeight - scrollTop - clientHeight > 300);
      }
    };
    const scrollEl = scrollRef.current;
    scrollEl?.addEventListener('scroll', handleScroll);
    return () => scrollEl?.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBottom = () => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initialize Web Worker
  useEffect(() => {
    workerRef.current = new AntiPatternsWorker();
    return () => workerRef.current?.terminate();
  }, []);

  // Async evaluation helper
  const evaluateResponseAsync = (text: string, prompt: string): Promise<any> => {
    return new Promise((resolve) => {
      if (!workerRef.current) {
        resolve(evaluateResponse(text, prompt));
        return;
      }
      const id = Date.now().toString() + Math.random().toString();
      const handler = (e: MessageEvent) => {
        if (e.data.id === id) {
          workerRef.current?.removeEventListener('message', handler);
          resolve(e.data.result);
        }
      };
      workerRef.current.addEventListener('message', handler);
      workerRef.current.postMessage({ id, text, prompt });
    });
  };

  // Auto-scroll effect
  useEffect(() => {
    if (!showScrollButton) {
      msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isBusy, showScrollButton]);

  // Auto-start video generation for Director agent
  useEffect(() => {
    if (agent === AgentType.DIRECTOR && messages.length === 0) {
      const instantPrompt = STARTER_PROMPTS[AgentType.DIRECTOR]?.[0]?.prompt || "Cinematic shot";
      executePrompt(instantPrompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent, messages.length]);

  // Helper to update a task deep in the message history
  const updateTaskInHistory = (taskId: string, updates: Partial<Task>) => {
      dispatchMessages(prev => prev.map(msg => {
          if (!msg.tasks) return msg;
          const hasTask = msg.tasks.some(t => t.id === taskId);
          if (!hasTask) return msg;
          
          return {
              ...msg,
              tasks: msg.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
          };
      }));
  };

  // Voice Input Handling
  const toggleListening = async () => {
      if (isListening) {
          mediaRecorderRef.current?.stop();
          setIsListening(false);
      } else {
          try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              const mediaRecorder = new MediaRecorder(stream);
              audioChunksRef.current = [];

              mediaRecorder.ondataavailable = (event) => {
                  if (event.data.size > 0) {
                      audioChunksRef.current.push(event.data);
                  }
              };

              mediaRecorder.onstop = async () => {
                  setIsTranscribing(true);
                  const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                  const reader = new FileReader();
                  reader.readAsDataURL(audioBlob);
                  reader.onloadend = async () => {
                      const base64data = reader.result as string;
                      const base64Audio = base64data.split(',')[1];
                      try {
                          const transcript = await runCommunicatorTranscription(base64Audio, 'audio/webm');
                          if (transcript) {
                              setInput(prev => prev + (prev ? ' ' : '') + transcript);
                          }
                      } catch (error) {
                          console.error("Transcription failed:", error);
                          alert("Transcription failed. Please try again.");
                      } finally {
                          setIsTranscribing(false);
                      }
                  };
                  stream.getTracks().forEach(track => track.stop());
              };

              mediaRecorderRef.current = mediaRecorder;
              mediaRecorder.start();
              setIsListening(true);
          } catch (error) {
              console.error("Microphone access denied:", error);
              alert("Microphone access is required for voice input.");
          }
      }
  };

  const executePrompt = async (text: string) => {
      setInput(text);
      // Small timeout to allow state update before sending
      setTimeout(() => handleSend(text), 100);
  };

  const executeAgentTask = async (task: Task) => {
      // 1. Mark executing (Add to Set)
      if (executingTaskIds.has(task.id)) return;
      
      setExecutingTaskIds(prev => {
          const next = new Set(prev);
          next.add(task.id);
          return next;
      });

      const execMsgId = `exec-${task.id}-${Date.now()}`;
      const userMsg: Message = { id: execMsgId, role: 'user', text: `Execute Task: ${task.title}`, timestamp: Date.now() };
      
      // Capture task execution in telemetry
      telemetryService.capture({
          type: 'action',
          content: `Executing Task: ${task.title}`,
          metadata: { taskId: task.id, assignedAgent: task.assignedAgent }
      });

      dispatchMessages(prev => [...prev, userMsg]);

      // 2. Prepare Context (History)
      const history = await new Promise<any[]>(resolve => setTimeout(() => resolve(mapMessagesToHistory(messages)), 0));

      // 3. Identify Agent
      const targetAgent = task.assignedAgent || AgentType.OVERSEER;
      
      try {
          let responseText = '';
          let responseImage = '';
          let responseVideo = '';
          
          // Execute based on agent type
          switch(targetAgent) {
              case AgentType.VISIONARY:
                   const v = await runVisionaryGen({ prompt: task.title, size: '1K', aspectRatio: '1:1' });
                   responseText = "Visual manifest complete.";
                   responseImage = v.data;
                   break;
              case AgentType.DIRECTOR:
                   const vi = await runDirectorAgent({ prompt: task.title, resolution: videoConfig.resolution, aspectRatio: videoConfig.aspectRatio, modelId: videoConfig.modelId });
                   responseText = "Sequence rendered.";
                   responseVideo = vi;
                   break;
              case AgentType.RESEARCHER:
                   responseText = await runResearcherAgent(task.title, history);
                   break;
              case AgentType.DEVELOPER:
                   responseText = await runDeveloperAgent(task.title, history, handleCanvasUpdate);
                   break;
              case AgentType.DATA_ANALYST:
                   responseText = await runDataAnalystAgent(task.title, history);
                   break;
              case AgentType.HR_MANAGER:
                   responseText = await runHrManagerAgent(task.title, history);
                   break;
              case AgentType.INTEGRATION_LEAD:
                   responseText = await runIntegrationAgent(task.title, history);
                   break;
              case AgentType.ANTIGRAVITY:
                   responseText = await runAntigravityAgent(task.title, history);
                   break;
              default:
                   // Fallback to Overseer logic, passing handleCanvasUpdate AND concurrency callback
                   const os = await runOverseerAgent(task.title, history, false, false, (count) => setConcurrencyCount(count), handleCanvasUpdate);
                   responseText = os.text || "Task executed by Overseer.";
                   if (os.videoUri) responseVideo = os.videoUri;
                   if (os.image) responseImage = os.image;
          }

          // 4. Complete Task and Store Result
          const completionMsg: Message = { 
              id: `resp-${task.id}-${Date.now()}`, 
              role: 'model', 
              text: responseText, 
              image: responseImage, 
              videoUri: responseVideo, 
              timestamp: Date.now(),
              metadata: { modelUsed: targetAgent }
          };
          
          dispatchMessages(prev => [...prev, completionMsg]);
          
          // Capture task completion in telemetry
          telemetryService.capture({
              type: 'action',
              content: `Task Completed: ${task.title}`,
              metadata: { taskId: task.id, assignedAgent: targetAgent, responseLength: responseText.length }
          });

          // Learn from success
          await memoryService.addMemory(`Task completed: ${task.title}. Output: ${responseText.substring(0, 100)}...`, 'interaction', ['task_success', targetAgent]);

          updateTaskInHistory(task.id, { 
              completed: true,
              output: responseText // Level 6.3: Store output
          });

      } catch (e: any) {
           dispatchMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: `Execution Fault: ${e.message}`, timestamp: Date.now() }]);
           updateTaskInHistory(task.id, { 
               status: 'failed',
               output: `Error: ${e.message}`
           });
      } finally {
          setExecutingTaskIds(prev => {
              const next = new Set(prev);
              next.delete(task.id);
              return next;
          });
      }
  };

  const handleSecurityResponse = (messageId: string, approved: boolean) => {
      dispatchMessages(prev => prev.map(m => 
          m.id === messageId && m.securityRequest 
              ? { ...m, securityRequest: { ...m.securityRequest, status: approved ? 'approved' : 'rejected' } } 
              : m
      ));
      
      const responseText = approved 
          ? `[System] The user has APPROVED the execution of the instructions from the source. Proceed with the task.`
          : `[System] The user has REJECTED the execution of the instructions from the source. DO NOT execute them. Acknowledge and continue with alternative steps if possible.`;
          
      handleSend(responseText);
  };

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || input;
    if ((!textToSend.trim() && !attachedAsset && agent !== AgentType.DIRECTOR && agent !== AgentType.VISIONARY) || isChatGenerating) return;

    let inputAsset: InputAsset | undefined;
    if (attachedAsset && assetType) {
        inputAsset = { type: assetType, data: attachedAsset, mimeType: assetMimeType };
    }

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: textToSend, inputAsset: inputAsset, timestamp: Date.now() };
    const updatedMessages = [...messages, userMsg];
    dispatchMessages(updatedMessages);
    
    // Capture user input in telemetry
    telemetryService.capture({
        type: 'action',
        content: `User Input: ${textToSend}`,
        metadata: { agent, assetType }
    });

    setInput('');
    setAttachedAsset(null);
    setAssetType(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setShowCommandPalette(false);
    setIsChatGenerating(true);
    addActivity(`User: ${textToSend.slice(0, 20)}...`);

    // Prepare Context
    const history = mapMessagesToHistory(messages);

    try {
      addActivity("Agent: Thinking...");
      let responseText = '';
      let responseImage = '';
      let responseVideo = '';
      let responseAudio = '';
      let responseAudit: AuditReport | undefined;
      let grounding: any[] = [];
      let tasks: Task[] = [];
      let metadata: any = {};
      const wasThinking = useThinking && agent === AgentType.OVERSEER;

       switch (agent) {
        case AgentType.OVERSEER:
          const overseerRes: any = await runOverseerAgent(
            userMsg.text || '', 
            history, 
            useGoogleSearch, 
            useThinking, 
            (count) => {
              setConcurrencyCount(count);
              if (count > 0) addActivity(`Parallel Tasks: ${count}`);
            },
            handleCanvasUpdate // Pass callback
          );
          responseText = overseerRes.text || '';
          grounding = overseerRes.groundingLinks;
          tasks = overseerRes.tasks || [];
          responseVideo = overseerRes.videoUri || '';
          responseImage = overseerRes.image || ''; 
          if (overseerRes.auditReport) responseAudit = overseerRes.auditReport;
          break;
        case AgentType.HR_MANAGER: responseText = await runHrManagerAgent(userMsg.text || '', history); break;
        case AgentType.INTEGRATION_LEAD: responseText = await runIntegrationAgent(userMsg.text || '', history); break;
        case AgentType.RESEARCHER: responseText = await runResearcherAgent(userMsg.text || '', history); break;
        case AgentType.DATA_ANALYST: responseText = await runDataAnalystAgent(userMsg.text || '', history); break;
        case AgentType.DEVELOPER: responseText = await runDeveloperAgent(userMsg.text || '', history, handleCanvasUpdate); break;
        case AgentType.NAVIGATOR: 
          const userPos = await getCurrentPosition();
          const navRes = await runNavigatorAgent(userMsg.text || '', userPos || { lat: 37.7749, lng: -122.4194 });
          responseText = navRes.text || ''; grounding = navRes.mapsLinks; break;
        case AgentType.SPEEDSTER: responseText = await runSpeedsterAgent(userMsg.text || '') || ''; break;
        case AgentType.ANTIGRAVITY: 
           responseText = await runAntigravityAgent(userMsg.text || '', history) || ''; break;
        case AgentType.VISIONARY:
          if (attachedAsset && assetType === 'image') {
             responseImage = await runVisionaryEdit(attachedAsset.split(',')[1], userMsg.text || ''); responseText = "Image edited.";
          } else {
             const visRes = await runVisionaryGen({ ...imageConfig, prompt: userMsg.text || imageConfig.prompt });
             responseImage = visRes.data; metadata = visRes.metadata; responseText = "Visual manifested.";
          }
          break;
        case AgentType.DIRECTOR:
           const finalPrompt = userMsg.text || videoConfig.prompt || "Video";
           const result = await generateVideo({ 
               ...videoConfig, 
               prompt: finalPrompt, 
               image: (attachedAsset && assetType === 'image') ? attachedAsset.split(',')[1] : undefined 
           }, videoConfig.modelId);
           
           responseVideo = result.uri; 
           metadata = { provider: result.provider, modelUsed: videoConfig.modelId }; 
           responseText = `Sequence rendered successfully.`;
           break;
        case AgentType.COMMUNICATOR:
           const textResponse = await runAntigravityAgent(userMsg.text || '', history) || '';
           responseText = textResponse || "I am processing your request.";
           const audioData = await runCommunicatorTTS(responseText);
           if (audioData) {
               responseAudio = audioData;
               setLatestAudio(audioData);
           }
           break;
        case AgentType.AI_EMPLOYEE:
           const aiEmpRes = await runAiEmployeeAgent(userMsg.text || '', history);
           
           // Try to parse emotion from the end of the response
           let emotion = 'professional';
           let cleanText = aiEmpRes;
           try {
             const jsonMatch = aiEmpRes.match(/```json\n([\s\S]*?)\n```$/);
             if (jsonMatch) {
               const parsed = JSON.parse(jsonMatch[1]);
               if (parsed.emotion) {
                 emotion = parsed.emotion;
                 cleanText = aiEmpRes.replace(/```json\n[\s\S]*?\n```$/, '').trim();
               }
             }
           } catch (e) {
             console.error("Failed to parse emotion", e);
           }
           
           responseText = cleanText;
           metadata = { emotion };
           break;
      }

      // Parse Security Alert
      let securityRequest: any = undefined;
      const securityMatch = responseText.match(/```json\s*({[\s\S]*?"security_alert":\s*true[\s\S]*?})\s*```/);
      if (securityMatch) {
          try {
              const parsed = JSON.parse(securityMatch[1]);
              securityRequest = {
                  source: parsed.source,
                  instructions: parsed.instructions,
                  status: 'pending'
              };
              responseText = responseText.replace(securityMatch[0], '').trim();
              if (!responseText) responseText = "⚠️ Security Alert: Potential prompt injection or unauthorized instructions detected in external content.";
          } catch (e) {
              console.error("Failed to parse security alert JSON", e);
          }
      }

      const analysis = await evaluateResponseAsync(responseText, userMsg.text || '');
      const botMsg: Message = { 
          id: (Date.now() + 1).toString(), 
          role: 'model', 
          text: responseText, 
          image: responseImage || undefined, 
          videoUri: responseVideo || undefined, 
          audioData: responseAudio || undefined, 
          auditReport: responseAudit, // Attach report
          groundingLinks: grounding, 
          tasks: tasks.length > 0 ? tasks : undefined, 
          timestamp: Date.now(), 
          isThinking: wasThinking, 
          qualityScore: analysis.score, 
          antiPatterns: analysis.issues, 
          metadata: metadata,
          securityRequest: securityRequest
      };
      dispatchMessages(prev => [...prev, botMsg]);

    } catch (e: any) {
       dispatchMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: `System Fault: ${e.message}`, timestamp: Date.now() }]);
    } finally {
      setIsChatGenerating(false);
      setConcurrencyCount(0);
      setAttachedAsset(null);
      setAssetType(null);
    }
  };

  const activePanel = showNeuralCore ? 'core' : showAgentSandbox ? 'sandbox' : showVncViewer ? 'vnc' : showLivePreview ? 'live-preview' : (showCanvas && activeArtifact) ? 'canvas' : null;

  return (
    <div className="flex h-full w-full overflow-hidden bg-zinc-50 dark:bg-[#050505] transition-colors duration-300">
      
      {/* 
          MAIN GRID LAYOUT 
          Refactored for flexible responsiveness:
          - Mobile (<768px): Single column. Side panel acts as overlay.
          - Tablet (>=768px): Split view [1fr_380px].
          - Desktop (>=1024px): Split view [1fr_480px].
          - Wide (>=1280px): Split view [1fr_600px].
      */}
      <div className={`
          grid h-full w-full transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]
          ${activePanel 
            ? 'grid-cols-1 md:grid-cols-[1fr_380px] lg:grid-cols-[1fr_480px] xl:grid-cols-[1fr_600px]' 
            : 'grid-cols-1'
          }
      `}>
          
          {/* --- LEFT AREA: CHAT INTERFACE --- */}
          <div className="relative flex flex-col h-full min-w-0 overflow-hidden">
              
              {/* 1. HEADER (Floating) */}
              <div className="absolute top-0 left-0 right-0 z-30 p-2 sm:p-4 pt-[max(0.5rem,env(safe-area-inset-top))] flex justify-between items-start pointer-events-none">
                  {/* Badge */}
                  <div className="pointer-events-auto glass-panel px-3 py-2 sm:px-4 rounded-full flex items-center gap-3 animate-in slide-in-from-top-4 duration-700 glow-border">
                      <div className={`w-2 h-2 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] ${isBusy ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                      <span className="text-[9px] sm:text-xs font-bold text-zinc-800 dark:text-zinc-100 brand-font tracking-[0.1em] sm:tracking-[0.15em] uppercase truncate max-w-[80px] sm:max-w-none">{agent}</span>
                      <div className="h-3 w-px bg-zinc-300 dark:bg-white/10 hidden sm:block"></div>
                      <span className="telemetry-text hidden sm:block">v3.2</span>
                  </div>

                  {/* Activity Feed (New) */}
                  <div className="hidden lg:flex pointer-events-auto flex-col gap-1 ml-4 animate-in fade-in duration-1000 delay-300">
                      {activityLog.map((log, i) => (
                          <div key={i} className="flex items-center gap-2 telemetry-text bg-white/40 dark:bg-black/20 backdrop-blur-sm px-2 py-0.5 rounded border border-zinc-200/50 dark:border-white/5 animate-in slide-in-from-left-2" style={{ opacity: 1 - (i * 0.2) }}>
                              <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse"></div>
                              {log}
                          </div>
                      ))}
                  </div>

                  {/* Toolbar */}
                  <div className="pointer-events-auto flex items-center gap-2 animate-in slide-in-from-top-4 duration-1000 delay-100">
                      {concurrencyCount > 0 && (
                          <div className="px-3 py-1.5 bg-cyan-100/50 dark:bg-cyan-950/40 border border-cyan-500/20 rounded-full flex items-center gap-2 text-cyan-600 dark:text-cyan-400 backdrop-blur-md mr-2 shadow-sm">
                              <Layers size={10} className="animate-spin-slow" />
                              <span className="text-[9px] font-bold tracking-widest">{concurrencyCount}</span>
                          </div>
                      )}
                      
                      <div className="glass-panel p-1 rounded-full flex items-center shadow-lg transition-colors glow-border">
                          {agent === AgentType.OVERSEER && (
                              <>
                                  <button onClick={() => setUseThinking(!useThinking)} className={`p-2 rounded-full transition-all ${useThinking ? 'bg-zinc-200 dark:bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`} title="Deep Reasoning"><BrainCircuit size={14}/></button>
                                  <button onClick={() => setUseGoogleSearch(!useGoogleSearch)} className={`p-2 rounded-full transition-all ${useGoogleSearch ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`} title="Web Grounding"><Search size={14}/></button>
                                  <div className="w-px h-4 bg-zinc-300 dark:bg-white/10 mx-1"></div>
                              </>
                          )}
                          
                           <button onClick={() => { setShowAgentSandbox(!showAgentSandbox); if(!showAgentSandbox) { setShowCanvas(false); setShowVncViewer(false); setShowNeuralCore(false); } }} className={`p-2 rounded-full transition-all flex items-center gap-1.5 ${showAgentSandbox ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-500/10 px-3' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`} title="Agent Sandbox">
                             <Bot size={14}/>
                             {showAgentSandbox && <span className="text-[10px] font-medium uppercase tracking-wider hidden xs:inline">Sandbox</span>}
                           </button>

                           <button onClick={() => { setShowNeuralCore(!showNeuralCore); if(!showNeuralCore) { setShowCanvas(false); setShowVncViewer(false); } }} className={`p-1.5 sm:p-2 rounded-full transition-all flex items-center gap-1.5 ${showNeuralCore ? 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/10 px-2 sm:px-3' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`} title="Neural Core">
                            <Cpu size={14}/>
                            {showNeuralCore && <span className="text-[10px] font-medium uppercase tracking-wider hidden xs:inline">Core</span>}
                          </button>
                          
                          <button onClick={() => { setShowVncViewer(!showVncViewer); if(!showVncViewer) { setShowCanvas(false); setShowNeuralCore(false); } }} className={`p-1.5 sm:p-2 rounded-full transition-all flex items-center gap-1.5 ${showVncViewer ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2 sm:px-3' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`} title="Workspace (VNC)">
                            <Monitor size={14}/>
                            {showVncViewer && <span className="text-[10px] font-medium uppercase tracking-wider hidden xs:inline">Workspace</span>}
                          </button>

                          {(agent === AgentType.DEVELOPER || activeArtifact) && (
                              <>
                                <button onClick={() => { setShowCanvas(!showCanvas); if(!showCanvas) { setShowNeuralCore(false); setShowVncViewer(false); setShowLivePreview(false); } }} className={`p-1.5 sm:p-2 rounded-full transition-all flex items-center gap-1.5 ${showCanvas ? 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 px-2 sm:px-3' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`} title="Canvas">
                                  <MonitorPlay size={14}/>
                                  {showCanvas && <span className="text-[10px] font-medium uppercase tracking-wider hidden xs:inline">Canvas</span>}
                                </button>
                                <button onClick={() => { setShowLivePreview(!showLivePreview); if(!showLivePreview) { setShowCanvas(false); setShowNeuralCore(false); setShowVncViewer(false); } }} className={`p-1.5 sm:p-2 rounded-full transition-all flex items-center gap-1.5 ${showLivePreview ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10 px-2 sm:px-3' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`} title="Live Preview">
                                  <Terminal size={14}/>
                                  {showLivePreview && <span className="text-[10px] font-medium uppercase tracking-wider hidden xs:inline">Live Preview</span>}
                                </button>
                              </>
                          )}
                          
                          <div className="w-px h-4 bg-zinc-300 dark:bg-white/10 mx-1"></div>
                          <button onClick={onOpenMcp} className="p-2 rounded-full transition-all text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 flex items-center gap-1.5" title="Global Settings & Keys">
                              <Settings size={14} />
                          </button>
                      </div>
                  </div>
              </div>

              {/* 2. CHAT HISTORY AREA (Flex Item - Scrollable) */}
              <div className="flex-1 relative min-h-0 flex flex-col bg-[#050505]">
                  <div 
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 scrollbar-hide"
                  >
                      <div className="max-w-3xl mx-auto w-full pb-32">
                          {messages.length === 0 ? (
                              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in fade-in zoom-in-95 duration-1000">
                                  <div className="w-20 h-20 rounded-3xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shadow-[0_0_50px_rgba(37,99,235,0.1)]">
                                      <Sparkles size={40} className="text-blue-400 animate-pulse" />
                                  </div>
                                  
                                  <div className="space-y-4">
                                      <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white" style={{ fontFamily: 'var(--font-display)' }}>How can I help you today?</h2>
                                      <p className="text-zinc-500 max-w-md mx-auto font-light">Select a specialized protocol or start a conversation to begin your journey into the Luxor9 Intelligence Core.</p>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl px-4">
                                      {(STARTER_PROMPTS[agent] || GENERIC_STARTERS).map((starter, i) => {
                                          const Icon = starter.icon;
                                          return (
                                              <button 
                                                  key={i} 
                                                  onClick={() => executePrompt(starter.prompt)}
                                                  className="group text-left p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300 flex flex-col gap-2"
                                              >
                                                  <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-white/5 flex items-center justify-center mb-1 text-zinc-400 group-hover:text-blue-400 transition-colors">
                                                      <Icon size={16} />
                                                  </div>
                                                  <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">{starter.label}</div>
                                                  <div className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2 font-light">{starter.prompt}</div>
                                              </button>
                                          )
                                      })}
                                   </div>
                               </div>
                             ) : (
                                 <div className="flex-1 space-y-6 pb-4">
                                    {messages.map(m => (
                                        <ChatMessage 
                                            key={m.id} 
                                            message={m} 
                                            onExecuteTask={executeAgentTask}
                                            executingTaskIds={executingTaskIds}
                                            onSecurityResponse={handleSecurityResponse}
                                        />
                                    ))}
                                 </div>
                             )}

                             {isChatGenerating && (
                                 <div className="flex justify-start py-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <div className="flex items-center gap-3 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-zinc-200 dark:border-white/5 text-zinc-500 dark:text-zinc-400 text-[10px] font-mono shadow-sm backdrop-blur-md">
                                        <div className="relative flex items-center justify-center">
                                            <Loader2 size={12} className="animate-spin text-blue-500" />
                                            <div className="absolute inset-0 blur-md bg-blue-500/20 animate-pulse"></div>
                                        </div>
                                        <span className="tracking-[0.2em] font-bold">LUXOR_PROCESSING...</span>
                                        <div className="flex gap-1">
                                            <div className="w-1 h-1 rounded-full bg-blue-500/40 animate-bounce [animation-delay:-0.3s]"></div>
                                            <div className="w-1 h-1 rounded-full bg-blue-500/40 animate-bounce [animation-delay:-0.15s]"></div>
                                            <div className="w-1 h-1 rounded-full bg-blue-500/40 animate-bounce"></div>
                                        </div>
                                    </div>
                                 </div>
                              )}
                              
                              <div ref={msgEndRef} className="h-4" />
                          </div>

                          {/* Scroll to Bottom Button */}
                          <AnimatePresence>
                            {showScrollButton && (
                              <motion.button
                                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                                onClick={scrollToBottom}
                                className="fixed bottom-24 sm:bottom-32 right-4 sm:right-8 p-2.5 sm:p-3 rounded-full bg-blue-600 text-white shadow-2xl hover:bg-blue-500 transition-colors z-[100] border border-white/20 backdrop-blur-md active:scale-90"
                              >
                                <ArrowDown size={18} className="sm:w-5 sm:h-5" />
                              </motion.button>
                            )}
                          </AnimatePresence>
                      </div>
               </div>

              {/* 3. INPUT OMNI-BAR (Flex Item - Pinned Bottom) */}
              <div className="flex-none z-40 px-3 sm:px-4 pb-4 sm:pb-[env(safe-area-inset-bottom,2rem)] pt-2 bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent transition-all relative">
                 
                 {/* DIRECTOR CONTROLS (Responsive) */}
                     {agent === AgentType.DIRECTOR && (
                        <div className="w-full max-w-3xl mx-auto mb-4 animate-in slide-in-from-bottom-2 duration-500">
                           <div className="bg-white/5 dark:bg-black/50 border border-white/10 rounded-2xl p-2 shadow-2xl backdrop-blur-xl">
                               <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
                                   {/* Model Select */}
                                   <div className="relative group col-span-2 sm:col-span-1">
                                       <select 
                                          value={videoConfig.modelId} 
                                          onChange={(e) => setVideoConfig({...videoConfig, modelId: e.target.value})}
                                          className="w-full sm:w-auto appearance-none bg-white/5 border border-white/10 rounded-xl pl-3 pr-8 py-2 telemetry-text font-bold text-zinc-200 outline-none cursor-pointer hover:bg-white/10 transition-all truncate"
                                       >
                                          {VIDEO_MODELS.map(m => (
                                             <option key={m.id} value={m.id} className="bg-zinc-900 text-zinc-200">
                                               {m.name}
                                             </option>
                                          ))}
                                       </select>
                                       <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                                           <ChevronDown size={12} />
                                       </div>
                                   </div>

                                   <div className="w-px h-4 bg-white/10 mx-2 hidden sm:block"></div>

                                   {/* Aspect Ratio */}
                                   <div className="flex bg-white/5 rounded-xl p-1 justify-center border border-white/10">
                                      {['16:9', '9:16'].map(ratio => (
                                          <button
                                            key={ratio}
                                            onClick={() => setVideoConfig({...videoConfig, aspectRatio: ratio as any})}
                                            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg telemetry-text font-bold transition-all ${videoConfig.aspectRatio === ratio ? 'bg-white text-zinc-900 shadow-lg' : 'text-zinc-400 hover:text-zinc-200'}`}
                                          >
                                            {ratio}
                                          </button>
                                      ))}
                                   </div>

                                   <div className="w-px h-4 bg-white/10 mx-2 hidden sm:block"></div>

                                   {/* Resolution */}
                                   <div className="flex bg-white/5 rounded-xl p-1 justify-center border border-white/10">
                                      {['720p', '1080p'].map(res => (
                                          <button
                                            key={res}
                                            onClick={() => setVideoConfig({...videoConfig, resolution: res as any})}
                                            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg telemetry-text font-bold transition-all ${videoConfig.resolution === res ? 'bg-white text-zinc-900 shadow-lg' : 'text-zinc-400 hover:text-zinc-200'}`}
                                          >
                                            {res}
                                          </button>
                                      ))}
                                   </div>
                               </div>
                           </div>
                        </div>
                     )}

                     <div className="w-full max-w-3xl mx-auto relative group mb-2">
                         
                         {/* Command Palette Overlay */}
                         <AnimatePresence>
                            {showCommandPalette && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute bottom-full left-0 w-full mb-4 bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-50"
                                >
                                    <div className="p-3 border-b border-white/5 bg-white/5">
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2">Quick Commands</span>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto p-2">
                                        {filteredCommands.length > 0 ? filteredCommands.map((cmd) => (
                                            <button
                                                key={cmd.id}
                                                onClick={() => handleCommandSelect(cmd)}
                                                className="w-full flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition-all text-left group"
                                            >
                                                <div className="p-2.5 bg-white/5 rounded-xl group-hover:bg-white/10 transition-colors">
                                                    <cmd.icon size={18} className="text-zinc-400" />
                                                </div>
                                                <span className="text-sm font-medium text-zinc-200">{cmd.label}</span>
                                            </button>
                                        )) : (
                                            <div className="p-10 text-center">
                                                <Search size={28} className="mx-auto text-zinc-700 mb-3 opacity-20" />
                                                <p className="text-xs text-zinc-500">No commands matching "{commandFilter}"</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                         </AnimatePresence>

                         {/* Input Glow */}
                         <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-1000"></div>
                         
                         <motion.div 
                            layout
                            className={`relative bg-black/60 backdrop-blur-3xl border rounded-3xl shadow-2xl flex items-end p-1.5 sm:p-2 transition-all duration-500 ${isChatGenerating ? 'border-amber-500/40 bg-black/80' : 'border-white/10 focus-within:border-white/20 focus-within:bg-black/90'}`}
                         >
                             {/* Neural Pulse Background */}
                             {isChatGenerating && (
                               <motion.div 
                                 animate={{ 
                                   opacity: [0.05, 0.15, 0.05],
                                   scale: [1, 1.02, 1]
                                 }}
                                 transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                 className="absolute -inset-1 bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-purple-500/10 rounded-[2.2rem] blur-2xl -z-10"
                               />
                             )}
                             
                             <button onClick={() => assetInputRef.current?.click()} className="p-3 sm:p-3.5 text-zinc-500 hover:text-white transition-colors rounded-2xl hover:bg-white/5 shrink-0 mr-0.5 sm:mr-1 mb-0.5">
                                <Paperclip size={18} className="sm:w-5 sm:h-5" />
                             </button>
                             
                             <button onClick={toggleListening} className={`p-3 sm:p-3.5 rounded-2xl transition-all mr-0.5 sm:mr-1 mb-0.5 ${isListening ? 'text-red-500 bg-red-500/10 animate-pulse' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                                {isListening ? <MicOff size={18} className="sm:w-5 sm:h-5" /> : <Mic size={18} className="sm:w-5 sm:h-5" />}
                             </button>

                             <motion.textarea 
                                ref={textareaRef}
                                value={input} 
                                onChange={handleInputChange} 
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        if (window.innerWidth > 768) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }
                                }}
                                placeholder={isListening ? "Listening..." : isTranscribing ? "Transcribing..." : (attachedAsset ? "Asset attached. Add context..." : "Ask Luxor9 anything...")}
                                className="flex-1 bg-transparent border-none text-[16px] sm:text-base text-zinc-100 placeholder-zinc-600 focus:outline-none px-2 font-light tracking-wide min-w-0 resize-none py-3 sm:py-3.5 max-h-[200px] leading-relaxed"
                                autoFocus 
                                disabled={isChatGenerating || isTranscribing}
                                rows={1}
                                style={{ minHeight: '44px' }}
                             />
                            
                             <div className="flex items-center gap-2 shrink-0 ml-1 sm:ml-2 mb-0.5 pr-0.5 sm:pr-1">
                                {isChatGenerating ? (
                                    <button 
                                        onClick={() => setIsChatGenerating(false)}
                                        className="p-3 sm:p-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl transition-all border border-red-500/20"
                                        title="Stop Generation"
                                    >
                                        <Square size={16} className="sm:w-[18px] sm:h-[18px]" fill="currentColor" />
                                    </button>
                            ) : (
                                    <button 
                                        onClick={() => handleSend()} 
                                        disabled={!input.trim() && !attachedAsset} 
                                        className={`p-3 sm:p-3.5 rounded-2xl transition-all ${input.trim() || attachedAsset ? 'bg-white text-black shadow-xl scale-105 active:scale-95' : 'bg-white/5 text-zinc-600 opacity-50'}`}
                                    >
                                         <ArrowRight size={18} className="sm:w-5 sm:h-5" strokeWidth={2.5} />
                                    </button>
                                )}
                             </div>
                         </motion.div>

                         {/* Asset Badge */}
                         {attachedAsset && (
                             <div className="absolute -top-12 left-0 bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-700 rounded-xl p-2 flex items-center gap-3 animate-in slide-in-from-bottom-2 shadow-xl backdrop-blur-md">
                                 <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden">
                                    {assetType === 'video' ? <Clapperboard size={14} className="text-zinc-400"/> : <img src={attachedAsset} className="w-full h-full object-cover opacity-80" alt="Asset" />}
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">Asset Linked</span>
                                    <span className="text-[9px] text-zinc-400 dark:text-zinc-600 font-mono truncate max-w-[120px]">{assetMimeType}</span>
                                 </div>
                                 <button onClick={() => { setAttachedAsset(null); setAssetType(null); }} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"><X size={12}/></button>
                             </div>
                         )}
                     </div>
                     
                     <input type="file" ref={assetInputRef} className="hidden" accept="image/*,video/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                                setAttachedAsset(evt.target?.result as string);
                                setAssetMimeType(file.type);
                                setAssetType(file.type.startsWith('video/') ? 'video' : 'image');
                            };
                            reader.readAsDataURL(file);
                        }
                     }} />
                  </div>
          </div>

          {/* --- RIGHT AREA: SIDE PANEL --- */}
          {activePanel && activePanel !== 'vnc' && (
            <div className={`
               /* Mobile: Fixed Overlay */
               fixed inset-0 z-50 
               /* Tablet+: Static Grid Item */
               md:static md:z-auto md:inset-auto md:h-full
               
               border-l border-zinc-200 dark:border-white/5 bg-white/95 dark:bg-black/95 md:bg-white/40 md:dark:bg-black/40 backdrop-blur-xl 
               flex flex-col shadow-2xl md:shadow-none
               animate-in slide-in-from-right duration-500 ease-luxor-depth
            `}>
               {activePanel === 'core' && <NeuralCore onClose={() => setShowNeuralCore(false)} />}
               {activePanel === 'sandbox' && <AgentSandbox />}
               {activePanel === 'canvas' && activeArtifact && <CanvasPanel artifact={activeArtifact} onClose={() => setShowCanvas(false)} />}
               {activePanel === 'live-preview' && <LivePreview code={activeArtifact?.code || ''} onClose={() => setShowLivePreview(false)} />}
            </div>
          )}
          
          {/* Persistent VNC Viewer Panel */}
          <div className={`
             /* Mobile: Fixed Overlay */
             fixed inset-0 z-50 
             /* Tablet+: Static Grid Item */
             md:static md:z-auto md:inset-auto md:h-full
             
             border-l border-zinc-200 dark:border-white/5 bg-white/95 dark:bg-black/95 md:bg-white/40 md:dark:bg-black/40 backdrop-blur-xl 
             flex flex-col shadow-2xl md:shadow-none
             transition-all duration-500 ease-luxor-depth
             ${activePanel === 'vnc' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none hidden'}
          `}>
             <VncViewer onClose={() => setShowVncViewer(false)} />
          </div>

      </div>
    </div>
  );
};