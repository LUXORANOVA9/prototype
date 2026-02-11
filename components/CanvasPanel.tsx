import React, { useState, useEffect, useRef } from 'react';
import { CanvasArtifact } from '../types';
import { X, Code, Play, Check, Copy, RefreshCw, Smartphone, Monitor } from 'lucide-react';

interface Props {
  artifact: CanvasArtifact;
  onClose: () => void;
  className?: string;
}

export const CanvasPanel: React.FC<Props> = ({ artifact, onClose, className }) => {
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('preview');
  const [key, setKey] = useState(0); // To force iframe refresh
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Reset to preview when artifact changes
    setActiveTab('preview');
    setKey(prev => prev + 1);
  }, [artifact]);

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.content);
  };

  const refreshPreview = () => {
    setKey(prev => prev + 1);
  };

  // Construct srcDoc for the iframe
  const getSrcDoc = () => {
    if (artifact.type === 'html' || artifact.type === 'react') {
      // Inject base styles for better preview
      const baseStyles = `
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #ffffff; color: #1a1a1a; }
          ::-webkit-scrollbar { width: 8px; height: 8px; }
          ::-webkit-scrollbar-track { background: #f1f1f1; }
          ::-webkit-scrollbar-thumb { background: #888; border-radius: 4px; }
          ::-webkit-scrollbar-thumb:hover { background: #555; }
        </style>
      `;
      
      // If content is just a fragment, wrap it
      let content = artifact.content;
      if (!content.trim().toLowerCase().startsWith('<!doctype html>') && !content.trim().toLowerCase().startsWith('<html')) {
           content = `
             <!DOCTYPE html>
             <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <script src="https://cdn.tailwindcss.com"></script>
                    ${baseStyles}
                </head>
                <body>
                    <div id="root" class="p-4">${content}</div>
                </body>
             </html>
           `;
      }
      return content;
    }
    
    // For Python/Other, just show text in preview or a placeholder
    return `
      <html>
        <body style="background:#1a1a1a;color:#eee;font-family:monospace;padding:20px;">
           <h3>${artifact.type.toUpperCase()} Output</h3>
           <pre>${artifact.content}</pre>
           <p style="color:#888;margin-top:20px;">* Visualization not available for this type. Switch to Code view.</p>
        </body>
      </html>
    `;
  };

  return (
    <div className={`flex flex-col h-full bg-zinc-50 dark:bg-[#0d0d0d] border-l border-zinc-200 dark:border-white/10 shadow-2xl relative z-50 ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-white/5 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
           <div className="w-2 h-8 bg-amber-500 rounded-full"></div>
           <div>
               <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[200px] brand-font tracking-wide">{artifact.title}</h3>
               <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono uppercase">
                   <span className="bg-zinc-200 dark:bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-800">{artifact.type}</span>
                   <span>{new Date(artifact.timestamp).toLocaleTimeString()}</span>
               </div>
           </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="flex bg-zinc-200 dark:bg-zinc-900 rounded-lg p-0.5 border border-zinc-300 dark:border-zinc-800">
               <button onClick={() => setActiveTab('code')} className={`p-1.5 rounded-md transition-all ${activeTab === 'code' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`}>
                   <Code size={14} />
               </button>
               <button onClick={() => setActiveTab('preview')} className={`p-1.5 rounded-md transition-all ${activeTab === 'preview' ? 'bg-amber-500 dark:bg-amber-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`}>
                   <Play size={14} />
               </button>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-colors ml-2">
               <X size={18} />
           </button>
        </div>
      </div>

      {/* Toolbar (Only for Preview) */}
      {activeTab === 'preview' && (
        <div className="px-4 py-2 border-b border-zinc-200 dark:border-white/5 bg-zinc-100 dark:bg-black/20 flex justify-between items-center shrink-0">
             <div className="flex items-center gap-2">
                 <button onClick={refreshPreview} className="text-zinc-500 hover:text-amber-500 transition-colors p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-900 rounded-md" title="Reload Frame">
                     <RefreshCw size={12} />
                 </button>
                 <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-800 mx-1"></div>
                 <button onClick={() => setViewport('mobile')} className={`p-1.5 rounded-md transition-all ${viewport === 'mobile' ? 'text-amber-600 dark:text-amber-500 bg-amber-500/10' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`}>
                     <Smartphone size={12} />
                 </button>
                 <button onClick={() => setViewport('desktop')} className={`p-1.5 rounded-md transition-all ${viewport === 'desktop' ? 'text-amber-600 dark:text-amber-500 bg-amber-500/10' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`}>
                     <Monitor size={12} />
                 </button>
             </div>
             <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-600">
                 Read-Only Sandbox
             </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative bg-white dark:bg-[#050505]">
          {activeTab === 'code' ? (
              <div className="absolute inset-0 overflow-auto custom-scrollbar p-4 bg-zinc-50 dark:bg-[#050505]">
                  <div className="absolute top-4 right-4 z-10">
                      <button onClick={handleCopy} className="p-2 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 transition-all">
                          <Copy size={14} />
                      </button>
                  </div>
                  <pre className="font-mono text-xs md:text-sm text-zinc-800 dark:text-blue-200 leading-relaxed whitespace-pre-wrap break-all">
                      <code>{artifact.content}</code>
                  </pre>
              </div>
          ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                  <iframe
                     key={key}
                     title="Preview"
                     srcDoc={getSrcDoc()}
                     className={`transition-all duration-500 shadow-2xl bg-white ${viewport === 'mobile' ? 'w-[375px] h-[667px] rounded-3xl border-8 border-zinc-800 dark:border-zinc-900' : 'w-full h-full border-none'}`}
                     sandbox="allow-scripts allow-modals allow-forms allow-popups"
                  />
              </div>
          )}
      </div>
    </div>
  );
};