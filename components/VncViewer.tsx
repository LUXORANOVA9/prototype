import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore
import RFB from '@novnc/novnc/core/rfb';
// @ts-ignore
import { initLogging } from '@novnc/novnc/core/util/logging';
import { Monitor, Play, Square, Settings, X, RefreshCw, Smartphone, Tablet, Laptop, Wifi, WifiOff, Loader2, MousePointer2, Keyboard, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Suppress noVNC console logs
initLogging('none');

interface VncViewerProps {
  url?: string;
  username?: string;
  password?: string;
  onClose?: () => void;
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';
type DeviceFrame = 'none' | 'mobile' | 'tablet';

export const VncViewer: React.FC<VncViewerProps> = ({ 
  url: initialUrl = typeof window !== 'undefined' ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:6080` : 'ws://localhost:6080', 
  username: initialUsername = '',
  password: initialPassword = '',
  onClose 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rfbRef = useRef<RFB | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [url, setUrl] = useState(initialUrl);
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState(initialPassword);
  const [showSettings, setShowSettings] = useState(false);
  const [deviceFrame, setDeviceFrame] = useState<DeviceFrame>('none');
  const [retryCount, setRetryCount] = useState(0);

  const connect = () => {
    if (!containerRef.current) return;
    
    setConnectionState('connecting');
    
    // Clean up any existing connection first
    if (rfbRef.current) {
      try {
        rfbRef.current.disconnect();
      } catch (e) {
        // Ignore errors if already disconnected
      }
      rfbRef.current = null;
    }
    
    try {
      let parsedUrl = url;
      let connectUsername = username;
      let connectPassword = password;

      try {
        // Try to extract credentials from URL (e.g. ws://user:pass@localhost:6080)
        const urlObj = new URL(url);
        if (urlObj.username || urlObj.password) {
          connectUsername = decodeURIComponent(urlObj.username) || username;
          connectPassword = decodeURIComponent(urlObj.password) || password;
          // Remove credentials from URL to avoid issues with some WebSocket implementations
          urlObj.username = '';
          urlObj.password = '';
          parsedUrl = urlObj.toString();
        }
      } catch (e) {
        // Invalid URL format, continue with original url
      }

      rfbRef.current = new RFB(containerRef.current, parsedUrl, {
        credentials: { username: connectUsername, password: connectPassword }
      });
      
      rfbRef.current.addEventListener('connect', () => {
        setConnectionState('connected');
        setRetryCount(0); // Reset retry count on success
        if (rfbRef.current) {
          try {
            rfbRef.current.scaleViewport = true;
            rfbRef.current.resizeSession = true;
          } catch (e) {
            console.warn("Error setting VNC viewport:", e);
          }
        }
      });
      
      rfbRef.current.addEventListener('disconnect', (e: any) => {
        setConnectionState(prev => prev === 'connecting' ? 'error' : 'disconnected');
      });

      // Handle credentials request automatically to bypass manual prompts
      rfbRef.current.addEventListener('credentialsrequired', () => {
        if (rfbRef.current) {
          rfbRef.current.sendCredentials({ username: connectUsername, password: connectPassword });
        }
      });
    } catch (e: any) {
      setConnectionState('error');
    }
  };

  const disconnect = () => {
    if (rfbRef.current) {
      try {
        rfbRef.current.disconnect();
      } catch (e) {
        console.warn("Error disconnecting VNC:", e);
      }
      rfbRef.current = null;
      setConnectionState('disconnected');
    }
  };

  // Auto-reconnect logic
  useEffect(() => {
    if (connectionState === 'error' && retryCount < 3) {
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        connect();
      }, 2000); // Retry after 2 seconds
      return () => clearTimeout(timer);
    }
  }, [connectionState, retryCount]);

  useEffect(() => {
    const handleVncCommand = (e: CustomEvent) => {
      if (!rfbRef.current || connectionState !== 'connected') return;
      
      const { action, x, y, text, key } = e.detail;
      
      try {
        switch (action) {
          case 'mouse_move':
            rfbRef.current.sendPointerEvent(x, y, 0);
            break;
          case 'mouse_click':
            // Send button down (1 = left click)
            rfbRef.current.sendPointerEvent(x, y, 1);
            // Send button up
            setTimeout(() => {
              if (rfbRef.current) rfbRef.current.sendPointerEvent(x, y, 0);
            }, 50);
            break;
          case 'mouse_right_click':
            rfbRef.current.sendPointerEvent(x, y, 4);
            setTimeout(() => {
              if (rfbRef.current) rfbRef.current.sendPointerEvent(x, y, 0);
            }, 50);
            break;
          case 'type':
            if (text) {
              for (let i = 0; i < text.length; i++) {
                const charCode = text.charCodeAt(i);
                rfbRef.current.sendKey(charCode, 1);
                rfbRef.current.sendKey(charCode, 0);
              }
            }
            break;
          case 'key':
            if (key) {
              rfbRef.current.sendKey(key, 1);
              rfbRef.current.sendKey(key, 0);
            }
            break;
          case 'screenshot':
            // We can capture the canvas and dispatch it back
            if (containerRef.current) {
              const canvas = containerRef.current.querySelector('canvas');
              if (canvas) {
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                window.dispatchEvent(new CustomEvent('vnc_screenshot_result', { detail: { dataUrl } }));
              }
            }
            break;
        }
      } catch (err) {
        console.error("Error executing VNC command:", err);
      }
    };

    window.addEventListener('vnc_command' as any, handleVncCommand);
    
    return () => {
      window.removeEventListener('vnc_command' as any, handleVncCommand);
    };
  }, [connectionState]);

  // Auto-connect on mount if URL is provided
  useEffect(() => {
    if (!url) return;
    
    // Small delay to ensure container is fully rendered
    const timer = setTimeout(() => {
      connect();
    }, 100);
    
    return () => {
      clearTimeout(timer);
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLeftClick = () => {
    if (rfbRef.current && containerRef.current) {
      const canvas = containerRef.current.querySelector('canvas');
      if (canvas) {
        const x = canvas.width / 2;
        const y = canvas.height / 2;
        rfbRef.current.sendPointerEvent(x, y, 1);
        setTimeout(() => {
          if (rfbRef.current) rfbRef.current.sendPointerEvent(x, y, 0);
        }, 50);
      }
    }
  };

  const handleRightClick = () => {
    if (rfbRef.current && containerRef.current) {
      const canvas = containerRef.current.querySelector('canvas');
      if (canvas) {
        const x = canvas.width / 2;
        const y = canvas.height / 2;
        rfbRef.current.sendPointerEvent(x, y, 4);
        setTimeout(() => {
          if (rfbRef.current) rfbRef.current.sendPointerEvent(x, y, 0);
        }, 50);
      }
    }
  };

  const handleKeyboardInput = () => {
    const text = prompt("Enter text to send:");
    if (text && rfbRef.current) {
      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        rfbRef.current.sendKey(charCode, 1);
        rfbRef.current.sendKey(charCode, 0);
      }
    }
  };

  const handleScreenCapture = () => {
    if (containerRef.current) {
      const canvas = containerRef.current.querySelector('canvas');
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = 'vnc-screenshot.jpg';
        a.click();
      }
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0E0E11] text-white overflow-hidden font-sans">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#18181B] border-b border-white/5 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Monitor size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 leading-tight">Workspace</h3>
            <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider">
              {connectionState === 'connected' ? (
                <span className="text-emerald-400 flex items-center gap-1"><Wifi size={10} /> Connected</span>
              ) : connectionState === 'connecting' ? (
                <span className="text-amber-400 flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Connecting...</span>
              ) : connectionState === 'error' ? (
                <span className="text-red-400 flex items-center gap-1"><WifiOff size={10} /> Connection Failed</span>
              ) : (
                <span className="text-zinc-500 flex items-center gap-1"><WifiOff size={10} /> Disconnected</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Device Frame Toggles (Flutter Suitable) */}
          <div className="flex items-center bg-black/20 rounded-lg p-1 border border-white/5 mr-2">
            <button 
              onClick={() => setDeviceFrame('none')}
              className={`p-1.5 rounded-md transition-colors ${deviceFrame === 'none' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'}`}
              title="Full Screen"
            >
              <Laptop size={14} />
            </button>
            <button 
              onClick={() => setDeviceFrame('tablet')}
              className={`p-1.5 rounded-md transition-colors ${deviceFrame === 'tablet' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'}`}
              title="Tablet Frame"
            >
              <Tablet size={14} />
            </button>
            <button 
              onClick={() => setDeviceFrame('mobile')}
              className={`p-1.5 rounded-md transition-colors ${deviceFrame === 'mobile' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'}`}
              title="Mobile Frame"
            >
              <Smartphone size={14} />
            </button>
          </div>

          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'}`}
            title="Connection Settings"
          >
            <Settings size={16} />
          </button>

          <div className="w-px h-5 bg-white/10 mx-1"></div>

          {connectionState !== 'connected' && connectionState !== 'connecting' ? (
            <button 
              onClick={connect} 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold rounded-lg transition-colors shadow-sm" 
              title="Connect"
            >
              <Play size={14} /> Connect
            </button>
          ) : connectionState === 'connecting' ? (
            <button 
              disabled
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-lg cursor-not-allowed" 
            >
              <Loader2 size={14} className="animate-spin" /> Connecting
            </button>
          ) : (
            <button 
              onClick={disconnect} 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-semibold rounded-lg transition-colors" 
              title="Disconnect"
            >
              <Square size={14} /> Disconnect
            </button>
          )}
          
          {onClose && (
            <>
              <div className="w-px h-5 bg-white/10 mx-1"></div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Settings Dropdown */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[#18181B] border-b border-white/5 overflow-hidden z-10"
          >
            <div className="p-4 flex flex-wrap items-end gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">WebSocket URL</label>
                <input 
                  type="text" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="bg-black/50 text-sm px-3 py-2 rounded-lg border border-white/10 font-mono w-64 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-zinc-200"
                  placeholder="ws://localhost:6080"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-black/50 text-sm px-3 py-2 rounded-lg border border-white/10 font-mono w-32 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-zinc-200"
                  placeholder="Optional"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-black/50 text-sm px-3 py-2 rounded-lg border border-white/10 font-mono w-32 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-zinc-200"
                  placeholder="Optional"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Bar (Only when connected) */}
      {connectionState === 'connected' && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[#18181B]/50 border-b border-white/5">
          <button onClick={handleLeftClick} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-md text-xs font-medium text-zinc-300 transition-colors">
            <MousePointer2 size={14} /> Left Click
          </button>
          <button onClick={handleRightClick} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-md text-xs font-medium text-zinc-300 transition-colors">
            <MousePointer2 size={14} className="rotate-180" /> Right Click
          </button>
          <button onClick={handleKeyboardInput} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-md text-xs font-medium text-zinc-300 transition-colors">
            <Keyboard size={14} /> Type Text
          </button>
          <div className="flex-1"></div>
          <button onClick={handleScreenCapture} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-md text-xs font-medium transition-colors">
            <Camera size={14} /> Capture
          </button>
        </div>
      )}

      {/* Main VNC Area */}
      <div className="flex-1 relative bg-[#09090B] overflow-hidden flex items-center justify-center p-4">
        
        {/* Device Frame Wrapper */}
        <div 
          className={`relative flex items-center justify-center transition-all duration-500 ease-in-out ${
            deviceFrame === 'mobile' ? 'w-[375px] h-[812px] border-[12px] border-zinc-800 rounded-[3rem] shadow-2xl overflow-hidden ring-1 ring-white/10' : 
            deviceFrame === 'tablet' ? 'w-[768px] h-[1024px] border-[16px] border-zinc-800 rounded-[2rem] shadow-2xl overflow-hidden ring-1 ring-white/10' : 
            'w-full h-full'
          }`}
        >
          {/* VNC Container */}
          <div 
            className="w-full h-full bg-black flex items-center justify-center" 
            ref={containerRef}
            style={{
              // When in a device frame, we want the canvas to fill the frame
              objectFit: deviceFrame !== 'none' ? 'contain' : 'fill'
            }}
          >
            {/* Connection Overlays */}
            {connectionState === 'disconnected' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10">
                <Monitor size={48} className="text-zinc-700 mb-4" />
                <h2 className="text-xl font-semibold text-zinc-300 mb-2">Workspace Offline</h2>
                <p className="text-sm text-zinc-500 mb-6 max-w-sm text-center">Connect to the VNC server to view and interact with the remote desktop environment.</p>
                <button 
                  onClick={connect} 
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/20" 
                >
                  <Play size={16} /> Connect Now
                </button>
              </div>
            )}

            {connectionState === 'connecting' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10">
                <Loader2 size={48} className="text-emerald-500 animate-spin mb-4" />
                <h2 className="text-xl font-semibold text-zinc-300 mb-2">Connecting...</h2>
                <p className="text-sm text-zinc-500 font-mono">{url}</p>
              </div>
            )}

            {connectionState === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10">
                <WifiOff size={48} className="text-red-500 mb-4" />
                <h2 className="text-xl font-semibold text-zinc-300 mb-2">Connection Failed</h2>
                <p className="text-sm text-zinc-500 mb-6 max-w-sm text-center">Could not establish a connection to the VNC server at <span className="font-mono text-zinc-400">{url}</span></p>
                <div className="flex gap-3">
                  <button 
                    onClick={connect} 
                    className="flex items-center gap-2 px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl transition-all" 
                  >
                    <RefreshCw size={16} /> Retry
                  </button>
                  <button 
                    onClick={() => setShowSettings(true)} 
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 font-semibold rounded-xl transition-all" 
                  >
                    <Settings size={16} /> Check Settings
                  </button>
                </div>
                {retryCount > 0 && retryCount < 3 && (
                  <p className="text-xs text-zinc-500 mt-4">Auto-retrying... ({retryCount}/3)</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
