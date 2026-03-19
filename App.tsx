import React, { Component, useState, useEffect, ReactNode, ErrorInfo, Suspense } from 'react';
import { AgentType } from './types';
import { AgentSelector } from './components/AgentSelector';
import { AgentWorkstation } from './components/AgentWorkstation';
import { McpPanel } from './components/McpPanel';
import { AlertTriangle, Loader2, MessageSquare, Layers, Activity, Workflow, Feather, BookOpen, Network } from 'lucide-react';
import { mcpClient } from './services/mcpClient';

// Lazy load heavy components
const LandingPage = React.lazy(() => import('./components/LandingPage'));
const ChatBoard = React.lazy(() => import('./components/ChatBoard'));
const FactoryFloor = React.lazy(() => import('./components/FactoryFloor'));
const AgentPlayground = React.lazy(() => import('./components/AgentPlayground'));
const DreamJournal = React.lazy(() => import('./components/DreamJournal'));
const NarrativeEngine = React.lazy(() => import('./components/NarrativeEngine'));
const MemoryPalace = React.lazy(() => import('./components/MemoryPalace'));

interface ErrorBoundaryProps {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public props: ErrorBoundaryProps;
  public state: ErrorBoundaryState;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("App Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#02050A] text-white p-8 text-center font-mono">
          <AlertTriangle size={48} className="text-amber-500 mb-4" />
          <h2 className="text-xl font-bold text-amber-500 mb-2">System Critical Failure</h2>
          <p className="text-zinc-500 mb-6 max-w-md">The factory encountered a fatal error during initialization.</p>
          <div className="bg-zinc-900/80 backdrop-blur p-4 rounded-xl border border-zinc-800 text-xs text-left w-full max-w-lg overflow-auto max-h-48 mb-6">
            {this.state.error?.toString() || "Unknown Error"}
          </div>
          <button 
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-500 rounded-full font-bold text-sm uppercase tracking-wider transition-all duration-300 hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] cursor-pointer"
          >
            Hard Reset & Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const GlobalStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap');

    :root {
      --white: hsl(0 0% 100%);
      --white-80: hsla(0,0%,100%,0.80);
      --white-60: hsla(0,0%,100%,0.60);
      --white-50: hsla(0,0%,100%,0.50);
      --white-30: hsla(0,0%,100%,0.30);
      --white-15: hsla(0,0%,100%,0.15);
      --white-10: hsla(0,0%,100%,0.10);
      --white-05: hsla(0,0%,100%,0.05);
      --white-01: hsla(0,0%,100%,0.01);
      --font-display: 'Instrument Serif', serif;
      --font-body: 'Inter', sans-serif;
      --font-story: 'Playfair Display', serif;
      --amber: #f59e0b;
      --amber-glow: rgba(245, 158, 11, 0.4);
    }

    /* Enhanced Liquid Glass */
    .liquid-glass {
      background: rgba(255,255,255,0.02);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.05);
      box-shadow: inset 0 0 20px rgba(255,255,255,0.02), 0 8px 32px -4px rgba(0,0,0,0.5);
      position: relative;
      overflow: hidden;
      transition: all 0.5s cubic-bezier(.16,.84,.24,1);
    }
    .liquid-glass::before {
      content: '';
      position: absolute;
      inset: -1px;
      background: linear-gradient(135deg, rgba(255,255,255,0.35) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.08) 100%);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      padding: 1px;
      border-radius: inherit;
      pointer-events: none;
    }
    .liquid-glass::after {
      content: '';
      position: absolute;
      top: 0; left: -100%; width: 50%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
      transform: skewX(-20deg);
      transition: 0.7s ease;
    }
    .liquid-glass:hover::after { left: 200%; }
    .liquid-glass:hover {
      background: rgba(255,255,255,0.05);
      border-color: rgba(255,255,255,0.12);
      transform: translateY(-2px);
    }
    .liquid-glass:active { transform: translateY(1px); }

    .liquid-glass-strong {
      background: rgba(255,255,255,0.04);
      backdrop-filter: blur(50px);
      -webkit-backdrop-filter: blur(50px);
      border: 1px solid rgba(255,255,255,0.08);
      box-shadow: inset 0 0 30px rgba(255,255,255,0.03), 0 12px 40px -4px rgba(0,0,0,0.5);
    }

    /* Animations */
    @keyframes fade-rise { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-rise { animation: fade-rise 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }

    /* Focus ring */
    button:focus-visible, a:focus-visible {
      outline: 2px solid rgba(245, 158, 11, 0.5);
      outline-offset: 4px;
      border-radius: 999px;
    }

    /* Selection */
    ::selection {
      background: rgba(245, 158, 11, 0.3);
      color: white;
    }
  `}} />
);

type ViewMode = 'agents' | 'chatboard' | 'factory' | 'playground' | 'journal' | 'narrative' | 'palace';

const AppContent: React.FC = () => {
  const [activeAgent, setActiveAgent] = useState<AgentType>(AgentType.OVERSEER);
  const [isMcpOpen, setIsMcpOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('chatboard');
  
  // Launch State
  const [hasLaunched, setHasLaunched] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  // Auto-connect MCP
  useEffect(() => {
    const lastSse = localStorage.getItem('luxor9_mcp_sse_url');
    if (lastSse && !mcpClient.isSseConnected(lastSse)) {
        mcpClient.connectSse(lastSse).catch(e => console.warn("Auto-reconnect failed", e));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('luxor9_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDark = savedTheme ? savedTheme === 'dark' : prefersDark;
    
    setIsDarkMode(initialDark);
  }, []);

  // Update DOM when theme changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('luxor9_theme', 'dark');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#02050A');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('luxor9_theme', 'light');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#fafafa');
    }
  }, [isDarkMode]);

  // Listen for custom launch event from index.html
  useEffect(() => {
    const handleLaunchEvent = () => handleLaunch();
    window.addEventListener('luxor9:launch', handleLaunchEvent);
    return () => window.removeEventListener('luxor9:launch', handleLaunchEvent);
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        setIsMcpOpen(prev => !prev);
      }
      if (!hasLaunched && !isLaunching && (e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleLaunch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasLaunched, isLaunching]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleLaunch = () => {
      setIsLaunching(true);
      setTimeout(() => {
          setHasLaunched(true);
          setIsLaunching(false);
      }, 1000);
  };

  return (
    <>
      {/* Landing Page Layer: Stays mounted during launch animation */}
      {(!hasLaunched || isLaunching) && (
        <ErrorBoundary fallback={null}>
            <Suspense fallback={
                <div className="fixed inset-0 bg-[#02050A] flex items-center justify-center z-50">
                    <Loader2 className="animate-spin text-amber-500" size={32} />
                </div>
            }>
                <LandingPage onLaunch={handleLaunch} isLaunching={isLaunching} />
            </Suspense>
        </ErrorBoundary>
      )}

      {/* Main App Layer */}
      {hasLaunched && !isLaunching && (
        <div className="flex flex-col h-[100dvh] w-full bg-[#02050A] text-zinc-200 overflow-hidden relative selection:bg-amber-500/30 transition-colors duration-300 animate-in fade-in duration-1000">
          <McpPanel 
            isOpen={isMcpOpen} 
            onClose={() => setIsMcpOpen(false)} 
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
          />

          {/* View Mode Toggle Bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-black/40 border-b border-white/5 z-40 shrink-0">
            <div className="flex items-center gap-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mr-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#02050A" strokeWidth="2.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <button
                onClick={() => setViewMode('chatboard')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  viewMode === 'chatboard'
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    : 'text-white/40 hover:text-white/60 border border-transparent'
                }`}
              >
                <MessageSquare size={14} />
                ChatBoard
              </button>
              <button
                onClick={() => setViewMode('agents')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  viewMode === 'agents'
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    : 'text-white/40 hover:text-white/60 border border-transparent'
                }`}
              >
                <Layers size={14} />
                Agent Factory
              </button>
              <button
                onClick={() => setViewMode('factory')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  viewMode === 'factory'
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    : 'text-white/40 hover:text-white/60 border border-transparent'
                }`}
              >
                <Activity size={14} />
                Factory Floor
              </button>
              <button
                onClick={() => setViewMode('playground')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  viewMode === 'playground'
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    : 'text-white/40 hover:text-white/60 border border-transparent'
                }`}
              >
                <Workflow size={14} />
                Playground
              </button>
              <button
                onClick={() => setViewMode('journal')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  viewMode === 'journal'
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    : 'text-white/40 hover:text-white/60 border border-transparent'
                }`}
              >
                <Feather size={14} />
                Journal
              </button>
              <button
                onClick={() => setViewMode('narrative')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  viewMode === 'narrative'
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    : 'text-white/40 hover:text-white/60 border border-transparent'
                }`}
              >
                <BookOpen size={14} />
                Narrative
              </button>
              <button
                onClick={() => setViewMode('palace')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  viewMode === 'palace'
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    : 'text-white/40 hover:text-white/60 border border-transparent'
                }`}
              >
                <Network size={14} />
                Memory
              </button>
            </div>
            <button
              onClick={() => setIsMcpOpen(true)}
              className="text-[10px] text-white/30 hover:text-white/60 font-mono uppercase tracking-wider cursor-pointer transition-colors"
            >
              System
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-h-0 relative z-0">
            <Suspense fallback={
              <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-amber-500" size={24} />
              </div>
            }>
              {viewMode === 'chatboard' ? (
                <ChatBoard />
              ) : viewMode === 'factory' ? (
                <FactoryFloor />
              ) : viewMode === 'playground' ? (
                <AgentPlayground />
              ) : viewMode === 'journal' ? (
                <DreamJournal />
              ) : viewMode === 'narrative' ? (
                <NarrativeEngine />
              ) : viewMode === 'palace' ? (
                <MemoryPalace />
              ) : (
                <div className="flex flex-col md:flex-row h-full">
                  <div className="order-2 md:order-1 flex-none z-30">
                    <AgentSelector 
                      activeAgent={activeAgent} 
                      onSelect={setActiveAgent} 
                      onOpenMcp={() => setIsMcpOpen(true)}
                      isDarkMode={isDarkMode}
                      onToggleTheme={toggleTheme}
                    />
                  </div>
                  <div className="order-1 md:order-2 flex-1 h-full relative min-h-0 z-0">
                    <AgentWorkstation 
                      agent={activeAgent} 
                      onOpenMcp={() => setIsMcpOpen(true)}
                    />
                  </div>
                </div>
              )}
            </Suspense>
          </div>
        </div>
      )}
    </>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <GlobalStyles />
      <AppContent />
    </ErrorBoundary>
  );
};

export default App;
