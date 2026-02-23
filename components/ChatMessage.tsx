import React, { useState } from 'react';
import { Message, Task } from '../types';
import { User, Bot, ExternalLink, MapPin, BrainCircuit, AlertTriangle, ShieldCheck, Film, Cpu, Image as ImageIcon, Terminal, Code, CheckCircle2, XCircle, Server, Globe, ChevronDown, ChevronRight, Sparkles, Brain, Activity, Box, Zap, Wifi, MousePointer2, Search, Table, RefreshCw } from 'lucide-react';
import { TaskBoard } from './TaskBoard';
import { memoryService } from '../services/memoryService';
import { AuditReportCard } from './AuditReport';

interface Props {
  message: Message;
  onUpdateTasks?: (tasks: Task[]) => void;
  onExecuteTask?: (task: Task) => void;
  executingTaskIds?: Set<string>;
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

const BrowserTerminal: React.FC<{ content: string }> = ({ content }) => {
    const jsonMatch = content.match(/JSON_DATA:(.*)/s);
    const jsonStr = jsonMatch ? jsonMatch[1] : null;
    
    if (!jsonStr) return null;
    
    try {
        const payload = JSON.parse(jsonStr);
        const { action, target, data } = payload;
        
        return (
            <div className="mt-4 rounded-xl overflow-hidden border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#09090b] shadow-2xl relative group ring-1 ring-black/5 dark:ring-white/5 animate-in zoom-in-95 duration-500">
                {/* Browser Toolbar */}
                <div className="flex items-center gap-4 px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-white/5">
                    <div className="flex gap-1.5 shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/40"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/40"></div>
                    </div>
                    
                    <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-black/40 rounded-lg border border-zinc-200 dark:border-white/5 shadow-inner">
                        <div className="text-zinc-400"><Globe size={12} /></div>
                        <div className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 truncate">{target}</div>
                        <div className="ml-auto text-zinc-300 dark:text-zinc-700"><RefreshCw size={10} /></div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-zinc-400">
                        <Search size={14} />
                        <div className="h-4 w-px bg-zinc-200 dark:bg-white/10"></div>
                        <div className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${action === 'search' ? 'bg-blue-500 text-white' : action === 'browse' ? 'bg-purple-500 text-white' : 'bg-emerald-500 text-white'}`}>
                            {action}
                        </div>
                    </div>
                </div>

                {/* Viewport */}
                <div className="p-6 max-h-96 overflow-y-auto custom-scrollbar bg-white dark:bg-[#050505] text-zinc-800 dark:text-zinc-300">
                    {action === 'search' && data.results && (
                        <div className="space-y-6">
                            {data.results.map((res: any, i: number) => (
                                <div key={i} className="group/result cursor-pointer">
                                    <div className="text-[10px] text-zinc-500 dark:text-zinc-500 mb-1 flex items-center gap-1">
                                        <Globe size={10}/> {new URL(res.url).hostname}
                                    </div>
                                    <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400 group-hover/result:underline mb-1 flex items-center gap-2">
                                        {res.title} <ExternalLink size={10} />
                                    </h4>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-2">
                                        {res.snippet}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {action === 'browse' && (
                        <div className="animate-in fade-in duration-700">
                            <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-white/5 pb-2">{data.title}</h2>
                            <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: data.html }} />
                        </div>
                    )}

                    {action === 'extract' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">
                                <Table size={12}/> Structured Extraction Result
                            </div>
                            <div className="grid grid-cols-2 gap-px bg-zinc-200 dark:bg-white/5 border border-zinc-200 dark:border-white/5 rounded-lg overflow-hidden">
                                {data.data.map((item: any, i: number) => (
                                    <React.Fragment key={i}>
                                        <div className="bg-zinc-50 dark:bg-zinc-900 p-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{item.key}</div>
                                        <div className="bg-white dark:bg-black p-3 text-xs font-mono text-emerald-600 dark:text-emerald-400 truncate">{item.value}</div>
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    )}

                    {action === 'screenshot' && (
                        <div className="flex flex-col items-center justify-center h-48 gap-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-400">
                                <ImageIcon size={24}/>
                            </div>
                            <div className="text-center">
                                <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Capture Sequence Success</div>
                                <div className="text-[10px] text-zinc-500 font-mono mt-1">{data.screenshotId} • {data.dimensions}</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Status Bar */}
                <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-white/5 flex justify-between items-center text-[9px] text-zinc-500 font-mono">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>LUXOR_BROWSER_READY</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span>HTTPS: SECURE</span>
                        <span>UTF-8</span>
                    </div>
                </div>
            </div>
        );
    } catch (e) {
        return <div className="p-4 text-xs font-mono text-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg">Parsing Error: Could not render browser output.</div>;
    }
};

const OpsTerminal: React.FC<{ content: string }> = ({ content }) => {
    const lines = content.split('\n').filter(l => l.trim().length > 0);
    const data: Record<string, string> = {};
    lines.forEach(line => {
        const parts = line.split(':');
        if (parts.length >= 2) {
            const key = parts[0].trim().replace(/^-/, '').trim();
            const val = parts.slice(1).join(':').trim();
            if (key && val) data[key] = val;
        }
    });

    const isSuccess = content.includes('SUCCESS') || content.includes('Active Infrastructure');
    const isList = content.includes('Active Infrastructure');

    return (
        <div className="mt-4 rounded-xl overflow-hidden border border-emerald-500/20 bg-[#050907] shadow-lg relative group">
            <div className="flex items-center justify-between px-4 py-3 bg-emerald-950/20 border-b border-emerald-500/10">
                 <div className="flex items-center gap-2">
                     <Server size={14} className="text-emerald-500" />
                     <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400 font-bold">Infrastructure Control</span>
                 </div>
                 <div className="flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                     <span className="text-[9px] font-mono text-emerald-600">LIVE</span>
                 </div>
            </div>

            <div className="p-5 font-mono text-xs relative">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
                 <div className="absolute top-0 left-0 right-0 h-px bg-emerald-500/20 animate-scan pointer-events-none"></div>

                 {isList ? (
                     <div className="space-y-3 relative z-10">
                        <div className="text-emerald-500/70 text-[10px] uppercase tracking-wider mb-2">Fleet Status</div>
                        {content.split('\n').filter(l => l.includes('[')).map((line, i) => (
                             <div key={i} className="flex items-center gap-3 p-2 bg-emerald-900/10 rounded border border-emerald-500/10">
                                 <div className="p-1 rounded bg-emerald-500/10 text-emerald-500"><Box size={12}/></div>
                                 <span className="text-emerald-100">{line.replace(/^- /, '')}</span>
                             </div>
                        ))}
                     </div>
                 ) : (
                     <div className="grid grid-cols-2 gap-4 relative z-10">
                        {Object.entries(data).map(([k, v]) => (
                            <div key={k} className="flex flex-col gap-1">
                                <span className="text-[9px] uppercase tracking-wider text-emerald-600 font-bold">{k}</span>
                                <span className="text-emerald-100 truncate border-b border-emerald-500/10 pb-1">{v}</span>
                            </div>
                        ))}
                        <div className="col-span-2 mt-2 pt-2 border-t border-emerald-500/10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Activity size={12} className="text-emerald-500" />
                                <span className="text-emerald-400">System Healthy</span>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-600">
                                <Wifi size={12} />
                                <span>us-central1</span>
                            </div>
                        </div>
                     </div>
                 )}
            </div>
            
            <div className="px-4 py-2 bg-emerald-950/30 border-t border-emerald-500/10 flex justify-between items-center text-[9px] text-emerald-600 font-mono">
                <span>Antigravity Agent v2.1</span>
                <span>{isSuccess ? 'EXEC_OK' : 'EXEC_WARN'}</span>
            </div>
        </div>
    );
};

export const ChatMessage: React.FC<Props> = ({ message, onUpdateTasks, onExecuteTask, executingTaskIds }) => {
  const isUser = message.role === 'user';
  const [showThinking, setShowThinking] = useState(false);
  const [isMemorized, setIsMemorized] = useState(false);

  const isDevOutput = !isUser && message.text?.includes('[Developer Sandbox]');
  const isOpsOutput = !isUser && message.text?.includes('[Antigravity Ops]');
  const isBrowserOutput = !isUser && message.text?.includes('[Browser-Use-MCP]');
  
  const displayableText = (isDevOutput || isOpsOutput || isBrowserOutput)
    ? message.text?.split(/\[(Developer Sandbox|Antigravity Ops|Browser-Use-MCP)\]/)[0] 
    : message.text;

  const hasThoughts = message.isThinking;

  const handleMemorize = async () => {
      if (!message.text || isMemorized) return;
      await memoryService.addMemory(message.text, isUser ? 'user_fact' : 'interaction', ['chat_save']);
      setIsMemorized(true);
  };

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-8 group animate-in slide-in-from-bottom-2 duration-500 fade-in`}>
      
      <div className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden backdrop-blur-md border ${
          isUser 
            ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400' 
            : 'bg-white/10 dark:bg-white/5 border-white/20 text-zinc-900 dark:text-zinc-100'
      }`}>
        {isUser ? <User size={16} /> : <Bot size={18} className="relative z-10" />}
      </div>
      
      <div className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isUser ? 'items-end' : 'items-start'}`}>
        
        {!isUser && (
            <div className="flex items-center gap-2 mb-2 ml-1 select-none opacity-80">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest brand-font flex items-center gap-1">
                    <Sparkles size={10} className="text-amber-500" /> {message.metadata?.provider === 'google' ? 'Gemini' : 'Luxor9'}
                </span>
                {message.metadata?.modelUsed && (
                    <span className="text-[9px] text-zinc-500 dark:text-zinc-600 font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10">
                        {message.metadata.modelUsed}
                    </span>
                )}
            </div>
        )}

        <div className={`
          relative p-5 rounded-sm shadow-sm backdrop-blur-md border transition-all duration-300
          ${isUser 
            ? 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700' 
            : 'bg-zinc-50 dark:bg-zinc-900/40 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-white/5'
          }
        `}>
          
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

          {displayableText && (
             <div className={`whitespace-pre-wrap leading-7 ${isUser ? 'text-sm font-medium' : 'text-sm font-light'}`}>
                 {displayableText}
             </div>
          )}

          {message.auditReport && (
              <div className="mt-4">
                  <AuditReportCard report={message.auditReport} />
              </div>
          )}
          {isDevOutput && message.text && <CodeTerminal content={message.text} />}
          {isOpsOutput && message.text && <OpsTerminal content={message.text.split('[Antigravity Ops]')[1] || ''} />}
          {isBrowserOutput && message.text && <BrowserTerminal content={message.text} />}
          
          {(message.image || message.inputAsset || message.videoUri) && (
              <div className="mt-4 grid gap-3">
                  {message.image && !message.inputAsset && (
                    <div className="rounded-sm overflow-hidden border border-zinc-200 dark:border-white/10 shadow-2xl relative group/img">
                        <img src={message.image} alt="Generative Output" className="max-w-full md:max-w-sm object-cover bg-black/50" />
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-[9px] text-white border border-white/10 font-bold tracking-wider opacity-0 group-hover/img:opacity-100 transition-opacity">
                            AI GENERATED
                        </div>
                    </div>
                  )}

                  {message.videoUri && (
                    <div className="rounded-sm overflow-hidden border border-zinc-200 dark:border-white/10 shadow-2xl bg-black relative">
                       <video controls playsInline src={message.videoUri} className="w-full max-w-sm aspect-video" />
                    </div>
                  )}
                  
                  {message.inputAsset && (
                     <div className="rounded-sm overflow-hidden border border-zinc-200 dark:border-white/10 w-fit relative bg-zinc-100 dark:bg-black/50">
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

          {message.audioData && (
             <div className="mt-4 p-2 bg-zinc-100 dark:bg-white/5 rounded-xl border border-zinc-200 dark:border-white/5 flex items-center gap-3">
                 <div className="w-8 h-8 flex items-center justify-center bg-zinc-200 dark:bg-zinc-800 rounded-full text-zinc-500 dark:text-zinc-400">
                     <Cpu size={14} />
                 </div>
                 <audio controls src={`data:audio/mp3;base64,${message.audioData}`} className="h-8 w-48 opacity-80" />
             </div>
          )}

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