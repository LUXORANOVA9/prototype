import React, { useEffect, useRef, useState } from 'react';
import { WebContainer } from '@webcontainer/api';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { Play, Square, RefreshCw, Terminal as TerminalIcon, Code2, Loader2 } from 'lucide-react';
import { telemetryService } from '../services/telemetryService';

let webcontainerInstancePromise: Promise<WebContainer> | null = null;

export const getWebContainer = async () => {
  if (!window.crossOriginIsolated) {
    throw new Error('WebContainers require a cross-origin isolated environment. Please ensure COOP/COEP headers are set correctly.');
  }
  
  if (!webcontainerInstancePromise) {
    webcontainerInstancePromise = WebContainer.boot().catch(err => {
      webcontainerInstancePromise = null; // Reset on failure so we can retry
      throw err;
    });
  }
  return webcontainerInstancePromise;
};

interface LivePreviewProps {
  code: string;
  files?: Record<string, { file: { contents: string } }>;
  onClose?: () => void;
}

export const LivePreview: React.FC<LivePreviewProps> = ({ code, files, onClose }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [webcontainerInstance, setWebcontainerInstance] = useState<WebContainer | null>(null);
  const [terminal, setTerminal] = useState<Terminal | null>(null);
  const [url, setUrl] = useState<string>('');
  const [status, setStatus] = useState<'booting' | 'installing' | 'starting' | 'ready' | 'error'>('booting');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    let term: Terminal;
    let fitAddon: FitAddon;

    if (terminalRef.current && !terminal) {
      term = new Terminal({
        convertEol: true,
        theme: {
          background: '#050505',
          foreground: '#d4d4d4',
          cursor: '#d4d4d4',
          selectionBackground: '#264f78',
        },
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 12,
      });
      fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(terminalRef.current);
      fitAddon.fit();
      setTerminal(term);

      const handleResize = () => fitAddon.fit();
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        term.dispose();
      };
    }
  }, [terminalRef]);

  useEffect(() => {
    let instance: WebContainer;

    let isMounted = true;

    const initWebContainer = async () => {
      if (!terminal) return;
      
      try {
        setStatus('booting');
        terminal.write('\x1b[33m[System]\x1b[0m Booting WebContainer micro-OS...\r\n');
        
        // Boot WebContainer
        instance = await getWebContainer();
        
        if (!isMounted) {
          // If unmounted while booting, teardown immediately
          instance.teardown();
          webcontainerInstancePromise = null;
          return;
        }
        
        setWebcontainerInstance(instance);
        
        terminal.write('\x1b[32m[System]\x1b[0m WebContainer booted successfully.\r\n');

        // Mount files
        const defaultFiles = {
          'index.js': {
            file: {
              contents: code || 'console.log("Hello from WebContainer!");',
            },
          },
          'package.json': {
            file: {
              contents: JSON.stringify({
                name: "luxor9-live-preview",
                type: "module",
                dependencies: {
                  "express": "latest",
                  "nodemon": "latest"
                },
                scripts: {
                  "start": "node index.js",
                  "dev": "nodemon index.js"
                }
              }, null, 2),
            },
          },
        };

        await instance.mount(files || defaultFiles);
        terminal.write('\x1b[34m[System]\x1b[0m Files mounted.\r\n');

        // Listen for server ready
        instance.on('server-ready', (port, url) => {
          terminal.write(`\x1b[32m[System]\x1b[0m Server ready on port ${port}\r\n`);
          setUrl(url);
          setStatus('ready');
        });

        // Install dependencies
        setStatus('installing');
        terminal.write('\x1b[33m[System]\x1b[0m Installing dependencies...\r\n');
        const installProcess = await instance.spawn('npm', ['install']);
        
        installProcess.output.pipeTo(new WritableStream({
          write(data) {
            terminal.write(data);
            // Capture significant terminal output
            if (data.includes('error') || data.includes('failed') || data.includes('success')) {
                telemetryService.capture({ type: 'terminal', content: data.trim() });
            }
          }
        }));

        const installExitCode = await installProcess.exit;
        if (installExitCode !== 0) {
          throw new Error('Installation failed');
        }

        // Start dev server
        setStatus('starting');
        terminal.write('\x1b[33m[System]\x1b[0m Starting application...\r\n');
        const startProcess = await instance.spawn('npm', ['run', 'dev']);
        
        startProcess.output.pipeTo(new WritableStream({
          write(data) {
            terminal.write(data);
            // Capture significant terminal output
            if (data.includes('error') || data.includes('failed') || data.includes('ready')) {
                telemetryService.capture({ type: 'terminal', content: data.trim() });
            }
          }
        }));

      } catch (error: any) {
        console.error('WebContainer Error:', error);
        setStatus('error');
        setErrorMsg(error.message || 'Failed to start WebContainer');
        terminal?.write(`\x1b[31m[Error]\x1b[0m ${error.message}\r\n`);
      }
    };

    initWebContainer();

    return () => {
      isMounted = false;
      if (instance) {
        instance.teardown();
        webcontainerInstancePromise = null;
      }
    };
  }, [terminal]); // Removed code and files from dependencies to prevent rebooting

  // Update files when code changes
  useEffect(() => {
    if (webcontainerInstance && code) {
      webcontainerInstance.fs.writeFile('/index.js', code);
      // Capture file edit in telemetry
      telemetryService.capture({
          type: 'file_edit',
          content: `Updated /index.js with ${code.length} characters`,
          metadata: { path: '/index.js' }
      });
    }
  }, [code, webcontainerInstance]);

  return (
    <div className="flex flex-col h-full w-full bg-[#050505] text-zinc-300 font-mono text-sm overflow-hidden border-l border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/40">
        <div className="flex items-center gap-2">
          <Code2 size={16} className="text-amber-500" />
          <span className="font-bold tracking-wider text-xs uppercase">Live Preview</span>
          
          {/* Status Badge */}
          <div className="ml-4 flex items-center gap-2 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest">
            {status === 'booting' && <><Loader2 size={10} className="animate-spin text-blue-400"/> Booting OS</>}
            {status === 'installing' && <><Loader2 size={10} className="animate-spin text-amber-400"/> Installing</>}
            {status === 'starting' && <><Loader2 size={10} className="animate-spin text-purple-400"/> Starting</>}
            {status === 'ready' && <><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/> Ready</>}
            {status === 'error' && <><div className="w-2 h-2 rounded-full bg-red-500"/> Error</>}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <button onClick={() => {}} className="p-1.5 hover:bg-white/10 rounded-md text-zinc-400 hover:text-white transition-colors" title="Restart Server">
              <RefreshCw size={14} />
           </button>
           {onClose && (
             <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-md text-zinc-400 hover:text-red-400 transition-colors">
               <Square size={14} />
             </button>
           )}
        </div>
      </div>

      {/* Main Content Area - Split View */}
      <div className="flex-1 flex flex-col min-h-0">
        
        {/* Browser Preview */}
        <div className="flex-1 relative bg-white min-h-[50%]">
          {url ? (
            <iframe 
              ref={iframeRef}
              src={url} 
              className="w-full h-full border-none"
              title="Live Preview"
              allow="cross-origin-isolated"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-zinc-500">
               {status === 'error' ? (
                 <div className="text-red-400 text-center px-4">
                   <p className="font-bold mb-2">Failed to load preview</p>
                   <p className="text-xs">{errorMsg}</p>
                 </div>
               ) : (
                 <>
                   <Loader2 size={32} className="animate-spin mb-4 text-zinc-700" />
                   <p className="text-xs uppercase tracking-widest animate-pulse">Waiting for server...</p>
                 </>
               )}
            </div>
          )}
        </div>

        {/* Terminal Area */}
        <div className="h-1/3 min-h-[150px] border-t border-white/10 bg-[#050505] flex flex-col">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 border-b border-white/5 text-[10px] uppercase tracking-widest text-zinc-500">
            <TerminalIcon size={12} />
            Terminal Output
          </div>
          <div className="flex-1 p-2 overflow-hidden" ref={terminalRef}></div>
        </div>

      </div>
    </div>
  );
};
