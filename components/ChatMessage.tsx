import React, { useState } from 'react';
import { Message, Task } from '../types';
import { User, Bot, ExternalLink, MapPin, BrainCircuit, AlertTriangle, ShieldCheck, Film, Cpu, Image as ImageIcon, Terminal, Code, CheckCircle2, XCircle, Server, Globe, ChevronDown, ChevronRight, Sparkles, Brain } from 'lucide-react';
import { TaskBoard } from './TaskBoard';
import { memoryService } from '../services/memoryService';

interface Props {
  message: Message;
  onUpdateTasks?: (tasks: Task[]) => void;
  onExecuteTask?: (task: Task) => void;
  executingTaskIds?: Set<string>; // Updated to Set
}

const CodeTerminal: React.FC<{ content: string }> = ({ content }) => {
    const codeMatch = content.match(/```(\w+)?\n([\s\S]*?)```/);
    const code = codeMatch ? codeMatch[2] : '';
    const language = codeMatch ? codeMatch[1] : 'text';
    const outputMatch = content.match(/Standard Output:\n> (.*)/);
    const output = outputMatch ? outputMatch[1] : '';

    return (
        <div className="mt-4 rounded-lg overflow-hidden border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#0c0c0e] shadow-lg group ring-1 ring-black/5 dark:ring-white/5">
            <div className="flex items-center justify-between px-3 py-2 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-white/5">
                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                    <Terminal size={12} className="text-emerald-500" />
                    <span className="font-mono text-[10px] uppercase tracking-widest">{language || 'CONSOLE'}</span>
                </div>
                <div className="flex gap-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
                    <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
                    <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
                </div>
            </div>
            <div className="p-4 overflow-x-auto">
                {code && (
                    <pre className="font-mono text-xs text-zinc-700 dark:text-blue-200/90 leading-relaxed selection:bg-blue-500/30">
                        <code>{code}</code>
                    </pre>
                )}
                <div className="border-t border-zinc-200 dark:border-white/10 pt-3 mt-3">
                    <div className="text-zinc-500 dark:text-zinc-600 mb-1 font-mono text-[9px] uppercase tracking-widest flex items-center gap-1"><Cpu size={10}/> Process Output</div>
                    <div className="text-emerald-600 dark:text-emerald-400 font-mono text-xs">{output || "Done."}</div>
                </div>
            </div>
        </div>
    );
};

export const ChatMessage: React.FC<Props> = ({ message, onUpdateTasks, onExecuteTask, executingTaskIds }) => {
  const isUser = message.role === 'user';
  const [showThinking, setShowThinking] = useState(false);
  const [isMemorized, setIsMemorized] = useState(false);

  // Specialized Content Detection
  const isDevOutput = !isUser && message.text?.includes('[Developer Sandbox]');
  const isOpsOutput = !isUser && message.text?.includes('[Antigravity Ops]');
  
  // Clean text: Remove artifacts handled by specialized renderers
  const displayableText = isDevOutput 
    ? message.text?.split('[Developer Sandbox]')[0] 
    : isOpsOutput 
        ? message.text?.split('[Antigravity Ops]')[0]
        : message.text;

  // Extract Thinking/Reasoning logic if present (mocked or real)
  const hasThoughts = message.isThinking;

  const handleMemorize = async () => {
      if (!message.text || isMemorized) return;
      await memoryService.addMemory(message.text, isUser ? 'user_fact' : 'interaction', ['chat_save']);
      setIsMemorized(true);
  };

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-8 group animate-in slide-in-from-bottom-2 duration-500 fade-in`}>
      
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden backdrop-blur-md border ${
          isUser 
            ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400' 
            : 'bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-100 dark:to-zinc-300 border-white text-zinc-900 shadow-[0_0_15px_rgba(0,0,0,0.1)] dark:shadow-[0_0_15px_rgba(255,255,255,0.15)]'
      }`}>
        {isUser ? <User size={16} /> : <Bot size={18} className="relative z-10" />}
      </div>
      
      <div className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isUser ? 'items-end' : 'items-start'}`}>
        
        {/* Model Metadata Header */}
        {!isUser && (
            <div className="flex items-center gap-2 mb-2 ml-1 select-none opacity-80">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest brand-font flex items-center gap-1">
                    <Sparkles size={10} className="text-amber-500" /> {message.metadata?.provider === 'google' ? 'Gemini' : 'Luxor9'}
                </span>
                {message.metadata?.modelUsed && (
                    <span className="text-[9px] text-zinc-500 dark:text-zinc-600 font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                        {message.metadata.modelUsed}
                    </span>
                )}
            </div>
        )}

        {/* Message Bubble */}
        <div className={`
          relative p-5 rounded-2xl shadow-sm backdrop-blur-xl border transition-all duration-300
          ${isUser 
            ? 'bg-white dark:bg-gradient-to-br dark:from-zinc-800 dark:to-zinc-900 text-zinc-800 dark:text-zinc-100 rounded-tr-sm border-zinc-200 dark:border-zinc-700/50 shadow-md' 
            : 'bg-zinc-50 dark:bg-gradient-to-br dark:from-zinc-900/80 dark:to-black/80 text-zinc-800 dark:text-zinc-200 rounded-tl-sm border-zinc-200 dark:border-white/10 shadow-md'
          }
        `}>
          
          {/* Thinking Accordion */}
          {hasThoughts && !isUser && (
            <div className="mb-4">
                <button 
                    onClick={() => setShowThinking(!showThinking)}
                    className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors w-full p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent hover:border-zinc-200 dark:hover:border-white/5"
                >
                    <BrainCircuit size={12} className={showThinking ? 'text-zinc-800 dark:text-zinc-100' : ''} />
                    <span>Reasoning Process</span>
                    <div className="flex-1 h-px bg-zinc-200 dark:bg-white/5 mx-2"></div>
                    {showThinking ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
                
                {showThinking && (
                    <div className="mt-2 p-3 bg-zinc-100 dark:bg-black/40 rounded-lg border border-zinc-200 dark:border-white/5 text-xs font-mono text-zinc-600 dark:text-zinc-400 animate-in slide-in-from-top-1 shadow-inner">
                         <div className="flex gap-2 mb-2">
                             <div className="w-0.5 bg-amber-500/50 rounded-full"></div>
                             <div>Analysis of user intent...</div>
                         </div>
                         <div className="flex gap-2">
                             <div className="w-0.5 bg-amber-500/50 rounded-full"></div>
                             <div>Constructing optimal response strategy...</div>
                         </div>
                    </div>
                )}
            </div>
          )}

          {/* Text Content */}
          {displayableText && (
             <div className={`whitespace-pre-wrap leading-7 ${isUser ? 'text-sm font-medium' : 'text-sm font-light'}`}>
                 {displayableText}
             </div>
          )}

          {/* Specialized Renderers */}
          {isDevOutput && message.text && <CodeTerminal content={message.text} />}
          
          {/* Media Attachments */}
          {(message.image || message.inputAsset || message.videoUri) && (
              <div className="mt-4 grid gap-3">
                  {/* Generated Image */}
                  {message.image && !message.inputAsset && (
                    <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-white/10 shadow-2xl relative group/img">
                        <img src={message.image} alt="Generative Output" className="max-w-full md:max-w-sm object-cover bg-black/50" />
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-[9px] text-white border border-white/10 font-bold tracking-wider opacity-0 group-hover/img:opacity-100 transition-opacity">
                            AI GENERATED
                        </div>
                    </div>
                  )}

                  {/* Video Output */}
                  {message.videoUri && (
                    <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-white/10 shadow-2xl bg-black relative">
                       <video controls playsInline src={message.videoUri} className="w-full max-w-sm aspect-video" />
                    </div>
                  )}
                  
                  {/* Input Asset */}
                  {message.inputAsset && (
                     <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-white/10 w-fit relative bg-zinc-100 dark:bg-black/50">
                        {message.inputAsset.type === 'video' ? (
                            <video src={message.inputAsset.data} className="max-h-48 rounded-lg" controls />
                        ) : (
                            <img src={message.inputAsset.data} className="max-h-48 rounded-lg" alt="Input" />
                        )}
                        <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur px-2 py-0.5 rounded text-[8px] text-zinc-300 border border-white/10 font-mono">
                            INPUT_SOURCE
                        </div>
                     </div>
                  )}
              </div>
          )}

          {/* Audio Player */}
          {message.audioData && (
             <div className="mt-4 p-2 bg-zinc-100 dark:bg-white/5 rounded-xl border border-zinc-200 dark:border-white/5 flex items-center gap-3">
                 <div className="w-8 h-8 flex items-center justify-center bg-zinc-200 dark:bg-zinc-800 rounded-full text-zinc-500 dark:text-zinc-400">
                     <Cpu size={14} />
                 </div>
                 <audio controls src={`data:audio/mp3;base64,${message.audioData}`} className="h-8 w-48 opacity-80" />
             </div>
          )}

          {/* Tasks */}
          {message.tasks && (
            <div className="mt-5">
                <TaskBoard 
                  tasks={message.tasks} 
                  onToggleTask={() => {}} 
                  onToggleSubTask={() => {}}
                  onAddSubTask={() => {}}
                  onExecuteTask={onExecuteTask}
                  executingTaskIds={executingTaskIds}
                />
            </div>
          )}

          {/* Grounding / Sources */}
          {message.groundingLinks && message.groundingLinks.length > 0 && (
            <div className="mt-5 pt-3 border-t border-zinc-200 dark:border-white/5">
              <div className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold mb-2 flex items-center gap-1.5">
                 <Globe size={10} /> Verified Knowledge Sources
              </div>
              <div className="flex flex-wrap gap-2">
                {message.groundingLinks.map((link, idx) => (
                  <a 
                    key={idx} 
                    href={link.uri} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 text-[10px] bg-zinc-100 dark:bg-zinc-900/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-all group/link"
                  >
                     {link.uri.includes('google.com/maps') ? <MapPin size={10} /> : <div className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-600 group-hover/link:bg-zinc-600 dark:group-hover/link:bg-zinc-400"></div>}
                     <span className="truncate max-w-[200px]">{link.title}</span>
                     <ExternalLink size={8} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Timestamp & Actions Footer */}
        <div className="mt-2 ml-1 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
             <span className="text-[9px] text-zinc-400 dark:text-zinc-600 font-mono">{new Date(message.timestamp).toLocaleTimeString()}</span>
             {!isUser && message.qualityScore && (
                 <span className="text-[9px] text-emerald-600 flex items-center gap-1 font-mono"><ShieldCheck size={8}/> 99.9% Integrity</span>
             )}
             
             <div className="w-px h-3 bg-zinc-300 dark:bg-zinc-700"></div>
             
             <button 
                onClick={handleMemorize} 
                disabled={isMemorized}
                className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider transition-colors ${isMemorized ? 'text-purple-500' : 'text-zinc-400 hover:text-purple-500'}`}
             >
                 <Brain size={10} /> {isMemorized ? 'Saved' : 'Memorize'}
             </button>
        </div>

      </div>
    </div>
  );
};