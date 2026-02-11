import React, { useState, useRef, useEffect } from 'react';
import { AgentType, Message, ImageGenerationConfig, VideoGenerationConfig, Task, InputAsset, CanvasArtifact } from '../types';
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
  runDirectorAgent
} from '../services/geminiService';
import { generateVideo, VIDEO_MODELS } from '../services/videoService';
import { evaluateResponse } from '../utils/antiPatterns';
import { mapMessagesToHistory } from '../utils/geminiHelpers';
import { ChatMessage } from './ChatMessage';
import { Send, Image as ImageIcon, Loader2, Mic, MicOff, Search, BrainCircuit, Paperclip, Activity, Layers, ShieldCheck, Smartphone, Clapperboard, MonitorPlay, Settings, Cpu, ChevronRight, Zap, Sparkles, X, SidebarClose, Sidebar, ArrowRight, Square, Terminal, Code, Palette, Globe, Database, Network, Target } from 'lucide-react';
import { LiveInterface } from './LiveInterface';
import { mcpRouter } from '../services/mcpRouter';
import { CanvasPanel } from './CanvasPanel';
import { NeuralCore } from './NeuralCore';

const STARTER_PROMPTS: Partial<Record<AgentType, { label: string; prompt: string; icon: any }[]>> = {
    [AgentType.OVERSEER]: [
      { label: "Project Architect", prompt: "Create a comprehensive architectural plan for a scalable SaaS platform.", icon: Layers },
      { label: "Strategic Decomposition", prompt: "Break down the goal of 'Launching a successful AI startup' into actionable phases.", icon: Network },
      { label: "System Audit", prompt: "Analyze potential bottlenecks in a high-concurrency distributed system.", icon: Activity }
    ],
    [AgentType.DEVELOPER]: [
      { label: "React Component", prompt: "Write a modern, responsive React component for a dashboard analytics card using Tailwind CSS.", icon: Code },
      { label: "Python Script", prompt: "Create a Python script to parse a CSV file and calculate statistical anomalies.", icon: Terminal },
      { label: "Canvas UI", prompt: "Use the write_to_canvas tool to build a landing page for a coffee shop.", icon: MonitorPlay }
    ],
    [AgentType.VISIONARY]: [
      { label: "Cyberpunk City", prompt: "Generate a high-fidelity image of a futuristic cyberpunk city with neon lights and rain.", icon: Sparkles },
      { label: "Logo Design", prompt: "Create a minimalist logo concept for a tech company named 'Nexus'.", icon: Palette },
      { label: "Surreal Landscape", prompt: "A dreamlike landscape with floating islands and purple clouds.", icon: ImageIcon }
    ],
    [AgentType.RESEARCHER]: [
      { label: "Market Research", prompt: "Research the latest trends in Generative AI for 2024 and summarize key players.", icon: Globe },
      { label: "Tech Deep Dive", prompt: "Explain the differences between Transformer architecture and SSMs (State Space Models).", icon: Search },
      { label: "Competitor Analysis", prompt: "Find and analyze top 3 competitors in the project management software space.", icon: Target }
    ]
};

// Fallback for agents without specific starters
const GENERIC_STARTERS = [
    { label: "Identify Capability", prompt: "What are your core capabilities and how can you assist me?", icon: Cpu },
    { label: "Execute Task", prompt: "I have a complex task that requires multiple steps. Can you help me plan it?", icon: Zap },
    { label: "System Status", prompt: "Run a diagnostic check on all connected MCP nodes.", icon: Activity }
];

export const AgentWorkstation: React.FC<{ agent: AgentType; onOpenMcp: () => void }> = ({ agent, onOpenMcp }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Refactored Loading State for Parallelism
  const [isChatGenerating, setIsChatGenerating] = useState(false);
  const [executingTaskIds, setExecutingTaskIds] = useState<Set<string>>(new Set());
  
  const isBusy = isChatGenerating || executingTaskIds.size > 0;

  const [attachedAsset, setAttachedAsset] = useState<string | null>(null);
  const [assetType, setAssetType] = useState<'image' | 'video' | null>(null);
  const [assetMimeType, setAssetMimeType] = useState<string>('');
  
  // Voice Input
  const [isListening, setIsListening] = useState(false);
  const speechRecognitionRef = useRef<any>(null);

  // Panels
  const [activeArtifact, setActiveArtifact] = useState<CanvasArtifact | null>(null);
  const [showCanvas, setShowCanvas] = useState(false);
  const [showNeuralCore, setShowNeuralCore] = useState(false);
  
  const [concurrencyCount, setConcurrencyCount] = useState(0);

  const [imageConfig, setImageConfig] = useState<ImageGenerationConfig>({ prompt: '', size: '1K', aspectRatio: '1:1', provider: 'auto' });
  const [videoConfig, setVideoConfig] = useState<VideoGenerationConfig>({ prompt: '', aspectRatio: '16:9', resolution: '720p', modelId: VIDEO_MODELS[0].id });
  
  const [useThinking, setUseThinking] = useState(false);
  const [useGoogleSearch, setUseGoogleSearch] = useState(false);

  const assetInputRef = useRef<HTMLInputElement>(null);
  const msgEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll effect
  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isBusy]);

  const handleCanvasUpdate = (artifact: CanvasArtifact) => {
      setActiveArtifact(artifact);
      setShowCanvas(true);
      // On mobile, we might want to close neural core if canvas opens
      if (window.innerWidth < 768) setShowNeuralCore(false);
  };

  // Helper to update a task deep in the message history
  const updateTaskInHistory = (taskId: string, updates: Partial<Task>) => {
      setMessages(prev => prev.map(msg => {
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
  const toggleListening = () => {
      if (isListening) {
          speechRecognitionRef.current?.stop();
          setIsListening(false);
      } else {
          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          if (!SpeechRecognition) {
              alert("Voice input not supported in this browser.");
              return;
          }
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.lang = 'en-US';

          recognition.onstart = () => setIsListening(true);
          recognition.onend = () => setIsListening(false);
          recognition.onresult = (event: any) => {
              const transcript = event.results[0][0].transcript;
              setInput(prev => prev + (prev ? ' ' : '') + transcript);
          };

          speechRecognitionRef.current = recognition;
          recognition.start();
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
      
      // We append the initiation message. 
      // Note: In high concurrency, state updates might need functional combining if multiple tasks start exactly same MS.
      setMessages(prev => [...prev, userMsg]);

      // 2. Prepare Context (History)
      // Note: We capture history at the moment of execution start.
      const history = mapMessagesToHistory(messages);

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
                   const vi = await runDirectorAgent({ prompt: task.title, resolution: '720p', aspectRatio: '16:9' });
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
                   // Fallback to Overseer logic
                   const os = await runOverseerAgent(task.title, history, false, false);
                   responseText = os.text || "Task executed by Overseer.";
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
          
          setMessages(prev => [...prev, completionMsg]);
          
          // Update the original task as completed in the UI (Persistent)
          updateTaskInHistory(task.id, { 
              completed: true,
              output: responseText // Level 6.3: Store output
          });

      } catch (e: any) {
           setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: `Execution Fault: ${e.message}`, timestamp: Date.now() }]);
      } finally {
          setExecutingTaskIds(prev => {
              const next = new Set(prev);
              next.delete(task.id);
              return next;
          });
      }
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
    setMessages(updatedMessages);
    setInput('');
    setIsChatGenerating(true);

    // Prepare Context
    const history = mapMessagesToHistory(messages); // Use previous messages for history (excluding current userMsg which chat.sendMessage handles)

    try {
      let responseText = '';
      let responseImage = '';
      let responseVideo = '';
      let responseAudio = '';
      let grounding: any[] = [];
      let tasks: Task[] = [];
      let metadata: any = {};
      const wasThinking = useThinking && agent === AgentType.OVERSEER;

       switch (agent) {
        case AgentType.OVERSEER:
          const overseerRes = await runOverseerAgent(userMsg.text || '', history, useGoogleSearch, useThinking, (count) => setConcurrencyCount(count));
          responseText = overseerRes.text || '';
          grounding = overseerRes.groundingLinks;
          tasks = overseerRes.tasks || [];
          responseVideo = overseerRes.videoUri || '';
          responseImage = overseerRes.image || ''; 
          break;
        case AgentType.HR_MANAGER: responseText = await runHrManagerAgent(userMsg.text || '', history); break;
        case AgentType.INTEGRATION_LEAD: responseText = await runIntegrationAgent(userMsg.text || '', history); break;
        case AgentType.RESEARCHER: responseText = await runResearcherAgent(userMsg.text || '', history); break;
        case AgentType.DATA_ANALYST: responseText = await runDataAnalystAgent(userMsg.text || '', history); break;
        case AgentType.DEVELOPER: responseText = await runDeveloperAgent(userMsg.text || '', history, handleCanvasUpdate); break;
        case AgentType.NAVIGATOR: 
          const navRes = await runNavigatorAgent(userMsg.text || '', { lat: 37.7749, lng: -122.4194 });
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
           const result = await generateVideo({ ...videoConfig, prompt: userMsg.text || videoConfig.prompt || "Video", image: (attachedAsset && assetType === 'image') ? attachedAsset.split(',')[1] : undefined }, videoConfig.modelId);
           responseVideo = result.uri; metadata = { provider: result.provider, modelUsed: videoConfig.modelId }; responseText = `Sequence rendered.`;
           break;
        case AgentType.COMMUNICATOR:
           const audioData = await runCommunicatorTTS(userMsg.text || '');
           if (audioData) responseAudio = audioData; responseText = "Speech generated."; break;
      }

      const analysis = evaluateResponse(responseText, userMsg.text || '');
      const botMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: responseText, image: responseImage || undefined, videoUri: responseVideo || undefined, audioData: responseAudio || undefined, groundingLinks: grounding, tasks: tasks.length > 0 ? tasks : undefined, timestamp: Date.now(), isThinking: wasThinking, qualityScore: analysis.score, antiPatterns: analysis.issues, metadata: metadata };
      setMessages(prev => [...prev, botMsg]);

    } catch (e: any) {
       setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: `System Fault: ${e.message}`, timestamp: Date.now() }]);
    } finally {
      setIsChatGenerating(false);
      setConcurrencyCount(0);
      setAttachedAsset(null);
      setAssetType(null);
    }
  };

  // Determine active panel for layout
  const activePanel = showNeuralCore ? 'core' : (showCanvas && activeArtifact) ? 'canvas' : null;

  return (
    <div className="flex h-full w-full overflow-hidden bg-zinc-50 dark:bg-[#09090b] relative transition-colors duration-300">
      
      {/* --- LEFT COLUMN: MAIN CHAT INTERFACE --- */}
      <div className={`
          relative flex flex-col h-full min-w-0 transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]
          ${activePanel ? 'flex-1' : 'w-full'}
      `}>
          
          {/* 1. Top Header Bar (Floating) */}
          <div className="absolute top-0 left-0 right-0 z-30 p-4 flex justify-between items-start pointer-events-none">
              
              {/* Agent Badge */}
              <div className="pointer-events-auto bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-white/10 px-4 py-2 rounded-full shadow-lg flex items-center gap-3 animate-in slide-in-from-top-4 duration-700">
                  <div className={`w-2 h-2 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] ${isBusy ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100 brand-font tracking-[0.15em] uppercase hidden sm:block">{agent}</span>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100 brand-font tracking-[0.15em] uppercase sm:hidden">{agent.substring(0,3)}</span>
                  <div className="h-3 w-px bg-zinc-300 dark:bg-white/10"></div>
                  <span className="text-[9px] font-mono text-zinc-500">v3.2</span>
              </div>

              {/* Toolbar */}
              <div className="pointer-events-auto flex items-center gap-2 animate-in slide-in-from-top-4 duration-1000 delay-100">
                  {concurrencyCount > 0 && (
                      <div className="px-3 py-1.5 bg-cyan-100/50 dark:bg-cyan-950/40 border border-cyan-500/20 rounded-full flex items-center gap-2 text-cyan-600 dark:text-cyan-400 backdrop-blur-md mr-2">
                          <Layers size={10} className="animate-spin-slow" />
                          <span className="text-[9px] font-bold tracking-widest">{concurrencyCount}</span>
                      </div>
                  )}
                  
                  <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-white/10 p-1 rounded-full flex items-center shadow-lg transition-colors">
                      {agent === AgentType.OVERSEER && (
                          <>
                              <button onClick={() => setUseThinking(!useThinking)} className={`p-2 rounded-full transition-all ${useThinking ? 'bg-zinc-200 dark:bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`} title="Deep Reasoning"><BrainCircuit size={14}/></button>
                              <button onClick={() => setUseGoogleSearch(!useGoogleSearch)} className={`p-2 rounded-full transition-all ${useGoogleSearch ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`} title="Web Grounding"><Search size={14}/></button>
                              <div className="w-px h-4 bg-zinc-300 dark:bg-white/10 mx-1"></div>
                          </>
                      )}
                      
                      <button onClick={() => { setShowNeuralCore(!showNeuralCore); if(!showNeuralCore) setShowCanvas(false); }} className={`p-2 rounded-full transition-all ${showNeuralCore ? 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/10' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`} title="Neural Core"><Cpu size={14}/></button>
                      {(agent === AgentType.DEVELOPER || activeArtifact) && (
                          <button onClick={() => { setShowCanvas(!showCanvas); if(!showCanvas) setShowNeuralCore(false); }} className={`p-2 rounded-full transition-all ${showCanvas ? 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`} title="Canvas"><MonitorPlay size={14}/></button>
                      )}
                      
                      <div className="w-px h-4 bg-zinc-300 dark:bg-white/10 mx-1"></div>
                      <button onClick={onOpenMcp} className="p-2 rounded-full transition-all text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10" title="Global Settings & Keys">
                          <Settings size={14} />
                      </button>
                  </div>
              </div>
          </div>

          {/* 2. Main Stage (Content) */}
          <div className="flex-1 relative flex flex-col w-full h-full overflow-hidden">
             {agent === AgentType.COMMUNICATOR ? (
                 <LiveInterface />
             ) : (
                 <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth w-full relative">
                     <div className="min-h-full flex flex-col pt-24 pb-32 px-4 md:px-8 max-w-5xl mx-auto">
                         {messages.length === 0 ? (
                             <div className="flex-1 flex flex-col items-center justify-center select-none animate-in fade-in duration-700">
                                 {/* Welcome Icon */}
                                 <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-white to-zinc-100 dark:from-zinc-800 dark:to-black border border-zinc-200 dark:border-zinc-700 shadow-2xl flex items-center justify-center relative mb-8 group">
                                     <div className="absolute inset-0 bg-amber-500/10 dark:bg-zinc-800/50 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                                     <Sparkles size={32} className="text-zinc-400 group-hover:text-amber-500 transition-colors duration-500" />
                                     <div className="absolute -bottom-2 -right-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded text-[9px] font-mono text-zinc-500 uppercase">Idle</div>
                                 </div>
                                 
                                 <h3 className="text-2xl brand-font text-zinc-900 dark:text-zinc-200 tracking-wider mb-2 text-center">
                                    <span className="text-zinc-500">System</span> Ready
                                 </h3>
                                 <p className="text-zinc-500 text-sm max-w-md text-center mb-10 font-light">
                                    Initialize {agent.toLowerCase().replace('_', ' ')} protocol to begin sequence.
                                 </p>

                                 {/* Quick Start Cards */}
                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-3xl px-4">
                                    {(STARTER_PROMPTS[agent] || GENERIC_STARTERS).map((starter, idx) => {
                                        const Icon = starter.icon;
                                        return (
                                            <button 
                                                key={idx}
                                                onClick={() => executePrompt(starter.prompt)}
                                                className="group text-left p-4 rounded-xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:border-amber-500/30 dark:hover:border-white/10 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 shadow-sm dark:shadow-none"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-black/50 flex items-center justify-center mb-3 text-zinc-400 group-hover:text-amber-500 transition-colors">
                                                    <Icon size={16} />
                                                </div>
                                                <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">{starter.label}</div>
                                                <div className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2 group-hover:text-zinc-600 dark:group-hover:text-zinc-400">{starter.prompt}</div>
                                            </button>
                                        )
                                    })}
                                 </div>
                             </div>
                         ) : (
                             <div className="flex-1 space-y-6">
                                {messages.map(m => (
                                    <ChatMessage 
                                        key={m.id} 
                                        message={m} 
                                        onExecuteTask={executeAgentTask}
                                        executingTaskIds={executingTaskIds}
                                    />
                                ))}
                             </div>
                         )}

                         {isChatGenerating && (
                             <div className="flex justify-start py-6 animate-in fade-in duration-300">
                                <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-white/5 text-zinc-500 dark:text-zinc-400 text-xs font-mono shadow-lg">
                                    <div className="relative">
                                        <Loader2 size={14} className="animate-spin text-amber-500" />
                                        <div className="absolute inset-0 blur-sm bg-amber-500/40 animate-pulse"></div>
                                    </div>
                                    <span className="tracking-widest animate-pulse">PROCESSING_DATA_STREAM...</span>
                                </div>
                             </div>
                         )}
                         
                         <div ref={msgEndRef} className="h-4" />
                     </div>
                 </div>
             )}
          </div>

          {/* 3. Input Omni-Bar (Floating Overlay) */}
          {agent !== AgentType.COMMUNICATOR && (
              <div className="absolute bottom-0 left-0 right-0 z-40 px-4 pb-safe pt-4 bg-gradient-to-t from-zinc-50 dark:from-[#09090b] via-zinc-50/90 dark:via-[#09090b]/90 to-transparent transition-colors duration-300">
                 <div className="w-full max-w-2xl mx-auto relative group mb-2">
                     
                     {/* Input Glow */}
                     <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-500/20 to-zinc-700/20 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                     
                     <div className="relative bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl flex items-center p-2 transition-all focus-within:border-zinc-300 dark:focus-within:border-white/20 focus-within:bg-white dark:focus-within:bg-zinc-900/95">
                         
                         <button onClick={() => assetInputRef.current?.click()} className="p-3 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-all mr-1">
                            <Paperclip size={18} />
                         </button>
                         
                         <button onClick={toggleListening} className={`p-3 rounded-xl transition-all mr-1 ${isListening ? 'text-red-500 bg-red-100 dark:bg-red-500/20 animate-pulse' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5'}`}>
                            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                         </button>

                         <input 
                            type="text" 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)} 
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
                            placeholder={isListening ? "Listening..." : (attachedAsset ? "Asset attached. Add context..." : "Enter system directive...")}
                            className="flex-1 bg-transparent border-none text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none px-2 font-light tracking-wide font-mono min-w-0"
                            autoFocus 
                            disabled={isChatGenerating}
                         />
                        
                         <div className="flex items-center gap-1 shrink-0 ml-2">
                            {isChatGenerating ? (
                                <button 
                                    onClick={() => setIsChatGenerating(false)} // Simulate stop by resetting loading state
                                    className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all border border-red-500/20"
                                    title="Stop Generation"
                                >
                                    <Square size={16} fill="currentColor" />
                                </button>
                            ) : (
                                <button 
                                    onClick={() => handleSend()} 
                                    disabled={!input.trim() && !attachedAsset} 
                                    className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 rounded-xl transition-all disabled:opacity-50 disabled:bg-transparent disabled:text-zinc-300 dark:disabled:text-zinc-600 disabled:hover:text-zinc-300"
                                >
                                     <ArrowRight size={18} />
                                </button>
                            )}
                         </div>
                     </div>

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
          )}
      </div>

      {/* --- RIGHT COLUMN: RESPONSIVE SIDE PANEL --- */}
      {/* 
          Behavior: 
          - Mobile: Fixed Overlay (z-50) covering full screen.
          - Desktop: Relative Flex Item (z-auto) sharing space with chat.
      */}
      {activePanel && (
        <div className={`
           fixed inset-0 z-50 
           lg:relative lg:inset-auto lg:z-auto lg:w-[450px] xl:w-[600px] 
           border-l border-white/5 bg-white/80 dark:bg-black/80 lg:bg-white/40 lg:dark:bg-black/40 backdrop-blur-xl 
           transition-all duration-300 ease-in-out animate-in slide-in-from-right
           flex flex-col shadow-2xl
        `}>
           {activePanel === 'core' && <NeuralCore onClose={() => setShowNeuralCore(false)} />}
           {activePanel === 'canvas' && activeArtifact && <CanvasPanel artifact={activeArtifact} onClose={() => setShowCanvas(false)} />}
        </div>
      )}

    </div>
  );
};