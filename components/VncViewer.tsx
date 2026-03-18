import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore
import RFB from '@novnc/novnc/core/rfb';
// @ts-ignore
import { initLogging } from '@novnc/novnc/core/util/logging';
import { Monitor, Play, Square, Settings, X } from 'lucide-react';

// Suppress noVNC console logs
initLogging('none');

interface VncViewerProps {
  url?: string;
  username?: string;
  password?: string;
  onClose?: () => void;
}

export const VncViewer: React.FC<VncViewerProps> = ({ 
  url: initialUrl = typeof window !== 'undefined' ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:6080` : 'ws://localhost:6080', 
  username: initialUsername = '',
  password: initialPassword = '',
  onClose 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rfbRef = useRef<RFB | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [url, setUrl] = useState(initialUrl);
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState(initialPassword);
  const [resolution, setResolution] = useState('1024x768');
  const [colorDepth, setColorDepth] = useState('24');

  const connect = () => {
    if (!containerRef.current) return;
    
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
        setIsConnected(true);
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
        setIsConnected(false);
      });

      // Handle credentials request automatically to bypass manual prompts
      rfbRef.current.addEventListener('credentialsrequired', () => {
        if (rfbRef.current) {
          rfbRef.current.sendCredentials({ username: connectUsername, password: connectPassword });
        }
      });
    } catch (e: any) {
      setIsConnected(false);
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
      setIsConnected(false);
    }
  };

  useEffect(() => {
    const handleVncCommand = (e: CustomEvent) => {
      if (!rfbRef.current || !isConnected) return;
      
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
  }, [isConnected]);

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
    <div className="flex flex-col h-full w-full bg-zinc-950 text-white overflow-hidden">
      <div className="flex items-center justify-between p-2 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Monitor size={16} className="text-emerald-500" />
          <span className="text-sm font-mono font-bold">VNC Viewer</span>
        </div>
        <div className="flex items-center gap-2">
          <input 
            type="text" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="bg-zinc-800 text-xs px-2 py-1 rounded border border-zinc-700 font-mono w-48 focus:outline-none focus:border-emerald-500"
            placeholder="ws://localhost:6080"
          />
          <input 
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-zinc-800 text-xs px-2 py-1 rounded border border-zinc-700 font-mono w-24 focus:outline-none focus:border-emerald-500"
            placeholder="Username"
          />
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-zinc-800 text-xs px-2 py-1 rounded border border-zinc-700 font-mono w-24 focus:outline-none focus:border-emerald-500"
            placeholder="Password"
          />
          <select
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            className="bg-zinc-800 text-xs px-2 py-1 rounded border border-zinc-700 font-mono focus:outline-none focus:border-emerald-500"
            title="Resolution"
          >
            <option value="800x600">800x600</option>
            <option value="1024x768">1024x768</option>
            <option value="1280x720">1280x720</option>
            <option value="1920x1080">1920x1080</option>
          </select>
          <select
            value={colorDepth}
            onChange={(e) => setColorDepth(e.target.value)}
            className="bg-zinc-800 text-xs px-2 py-1 rounded border border-zinc-700 font-mono focus:outline-none focus:border-emerald-500"
            title="Color Depth"
          >
            <option value="8">8-bit</option>
            <option value="16">16-bit</option>
            <option value="24">24-bit</option>
          </select>
          {!isConnected ? (
            <button 
              onClick={connect} 
              className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded transition-colors" 
              title="Connect"
            >
              <Play size={14} /> Connect
            </button>
          ) : (
            <button 
              onClick={disconnect} 
              className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded transition-colors" 
              title="Disconnect"
            >
              <Square size={14} /> Disconnect
            </button>
          )}
          {onClose && (
            <>
              <div className="w-px h-4 bg-zinc-700 mx-1"></div>
              <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </>
          )}
        </div>
      </div>
      {isConnected && (
        <div className="flex items-center gap-2 p-2 bg-zinc-800 border-b border-zinc-700">
          <button onClick={handleLeftClick} className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs font-mono transition-colors">Left Click</button>
          <button onClick={handleRightClick} className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs font-mono transition-colors">Right Click</button>
          <button onClick={handleKeyboardInput} className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs font-mono transition-colors">Keyboard</button>
          <button onClick={handleScreenCapture} className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs font-mono transition-colors">Screen Capture</button>
        </div>
      )}
      <div className="flex-1 relative bg-black overflow-hidden" ref={containerRef}>
        {!isConnected && (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-600 font-mono text-sm">
            Not connected to VNC server
          </div>
        )}
      </div>
    </div>
  );
};
