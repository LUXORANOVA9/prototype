import React, { Component, useState, useEffect, ReactNode, ErrorInfo, Suspense } from 'react';
import { AgentType } from './types';
import { AgentSelector } from './components/AgentSelector';
import { AgentWorkstation } from './components/AgentWorkstation';
import { McpPanel } from './components/McpPanel';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { mcpClient } from './services/mcpClient';

// Lazy load LandingPage to isolate heavy 3D dependencies
const LandingPage = React.lazy(() => import('./components/LandingPage'));

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
        <div className="flex flex-col items-center justify-center h-screen bg-[#050505] text-white p-8 text-center font-mono">
          <AlertTriangle size={48} className="text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-red-500 mb-2">System Critical Failure</h2>
          <p className="text-zinc-500 mb-6 max-w-md">The application encountered a fatal error during initialization.</p>
          <div className="bg-zinc-900 p-4 rounded border border-zinc-800 text-xs text-left w-full max-w-lg overflow-auto max-h-48 mb-6">
            {this.state.error?.toString() || "Unknown Error"}
          </div>
          <button 
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-sm uppercase tracking-wider transition-colors"
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
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&family=Source+Serif+4:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&display=swap');

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
      --font-display: 'Source Serif 4', serif;
      --font-body: 'Poppins', sans-serif;
    }

    /* Liquid Glass */
    .liquid-glass { background: rgba(255,255,255,0.01); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); border: none; box-shadow: inset 0 1px 1px rgba(255,255,255,0.10); position: relative; overflow: hidden; }
    .liquid-glass::before { content: ''; position: absolute; inset: 0; border-radius: inherit; padding: 1.4px; background: linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 20%, transparent 40%, transparent 60%, rgba(255,255,255,0.15) 80%, rgba(255,255,255,0.45) 100%); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; }
    .liquid-glass-strong { backdrop-filter: blur(50px); -webkit-backdrop-filter: blur(50px); box-shadow: 4px 4px 4px rgba(0,0,0,0.05), inset 0 1px 1px rgba(255,255,255,0.15); }
    .liquid-glass-strong::before { background: linear-gradient(180deg, rgba(255,255,255,0.50) 0%, rgba(255,255,255,0.20) 20%, transparent 40%, transparent 60%, rgba(255,255,255,0.20) 80%, rgba(255,255,255,0.50) 100%); }

    /* Animations */
    @keyframes fade-rise { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-rise { animation: fade-rise 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
  `}} />
);

const AppContent: React.FC = () => {
  const [activeAgent, setActiveAgent] = useState<AgentType>(AgentType.OVERSEER);
  const [isMcpOpen, setIsMcpOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
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
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#09090b');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('luxor9_theme', 'light');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#fafafa');
    }
  }, [isDarkMode]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Settings with Ctrl/Cmd + ,
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        setIsMcpOpen(prev => !prev);
      }
      
      // Launch from Landing with Cmd+K
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
      }, 1000); // Wait for LandingPage exit animation
  };

  return (
    <>
      {/* Landing Page Layer: Stays mounted during launch animation */}
      {(!hasLaunched || isLaunching) && (
        <ErrorBoundary fallback={null}>
            <Suspense fallback={
                <div className="fixed inset-0 bg-[#050505] flex items-center justify-center z-50">
                    <Loader2 className="animate-spin text-amber-500" size={32} />
                </div>
            }>
                <LandingPage onLaunch={handleLaunch} isLaunching={isLaunching} />
            </Suspense>
        </ErrorBoundary>
      )}

      {/* Main App Layer */}
      {hasLaunched && !isLaunching && (
        <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-200 overflow-hidden relative selection:bg-amber-500/30 transition-colors duration-300 animate-in fade-in duration-1000">
          <McpPanel 
            isOpen={isMcpOpen} 
            onClose={() => setIsMcpOpen(false)} 
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
          />

          {/* Mobile: Bottom Order. Desktop: Left/First Order */}
          <div className="order-2 md:order-1 flex-none z-30">
            <AgentSelector 
              activeAgent={activeAgent} 
              onSelect={setActiveAgent} 
              onOpenMcp={() => setIsMcpOpen(true)}
              isDarkMode={isDarkMode}
              onToggleTheme={toggleTheme}
            />
          </div>
          
          {/* Main Content */}
          <div className="order-1 md:order-2 flex-1 h-full relative min-h-0 z-0">
            <AgentWorkstation 
              agent={activeAgent} 
              onOpenMcp={() => setIsMcpOpen(true)}
            />
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