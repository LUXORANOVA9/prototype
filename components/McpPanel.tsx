import React, { useState, useEffect } from 'react';
import { mcpRouter } from '../services/mcpRouter';
import { mcpClient } from '../services/mcpClient';
import { McpProfile, McpPlatform } from '../types';
import { Network, Plus, Trash2, Check, X, Key, Bot, Cloud, Sparkles, Box, Terminal, Cpu, Zap, Ghost, Layers, Server, Globe, ExternalLink, ShieldAlert, Settings, Activity } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const PLATFORMS: { id: McpPlatform; label: string; icon: any; color: string; url: string }[] = [
  { id: 'google', label: 'Google Gemini', icon: Cloud, color: 'text-blue-500', url: 'https://aistudio.google.com/app/apikey' },
  { id: 'huggingface', label: 'HuggingFace', icon: Ghost, color: 'text-yellow-400', url: 'https://huggingface.co/settings/tokens' },
  { id: 'openai', label: 'OpenAI', icon: Sparkles, color: 'text-green-400', url: 'https://platform.openai.com/api-keys' },
  { id: 'anthropic', label: 'Anthropic', icon: Box, color: 'text-orange-400', url: 'https://console.anthropic.com/settings/keys' },
  { id: 'replicate', label: 'Replicate', icon: Layers, color: 'text-purple-400', url: 'https://replicate.com/account/api-tokens' },
  { id: 'xai', label: 'xAI', icon: Cpu, color: 'text-zinc-400 dark:text-zinc-100', url: 'https://console.x.ai/' },
  { id: 'deepseek', label: 'DeepSeek', icon: Zap, color: 'text-cyan-400', url: 'https://platform.deepseek.com/' },
];

type Tab = 'keys' | 'mcp' | 'system';

export const McpPanel: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('keys');
  const [profiles, setProfiles] = useState<McpProfile[]>([]);
  const [newKey, setNewKey] = useState('');
  const [newName, setNewName] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<McpPlatform>('google');
  const [isAdding, setIsAdding] = useState(false);
  
  // MCP Connections State
  const [connections, setConnections] = useState<any[]>([]);
  const [newServerUrl, setNewServerUrl] = useState('');
  const [isAddingServer, setIsAddingServer] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProfiles();
      refreshConnections();
      
      // Auto-Reconnect Logic
      const lastSse = localStorage.getItem('luxor9_mcp_sse_url');
      if (lastSse && !mcpClient.isSseConnected(lastSse)) {
          console.log(`[Auto-Connect] Attempting to reconnect to ${lastSse}...`);
          mcpClient.connectSse(lastSse)
            .then(() => refreshConnections())
            .catch(e => console.warn("Auto-reconnect failed", e));
      }
    }
  }, [isOpen]);

  const loadProfiles = () => {
    setProfiles([...mcpRouter.getProfiles()]);
  };

  const refreshConnections = () => {
      setConnections([...mcpClient.getConnections()]);
  };

  const handleAddProfile = () => {
    if (newKey && newName) {
      mcpRouter.addProfile(newName, newKey, selectedPlatform);
      setNewKey('');
      setNewName('');
      setSelectedPlatform('google');
      setIsAdding(false);
      loadProfiles();
    }
  };

  const handleSelect = (id: string | null) => {
    mcpRouter.setActiveProfile(id);
    loadProfiles();
  };

  const handleDelete = (id: string) => {
    mcpRouter.removeProfile(id);
    loadProfiles();
  };

  const handleAddServer = async () => {
      if (newServerUrl) {
          localStorage.setItem('luxor9_mcp_sse_url', newServerUrl);
          await mcpClient.connectSse(newServerUrl);
          setNewServerUrl('');
          setIsAddingServer(false);
          refreshConnections();
      }
  };

  const handleDisconnect = async (id: string) => {
      await mcpClient.disconnect(id);
      refreshConnections();
  };

  const getPlatformIcon = (id: McpPlatform) => {
    const p = PLATFORMS.find(x => x.id === id);
    const Icon = p?.icon || Terminal;
    return <Icon size={14} className={p?.color || 'text-zinc-400'} />;
  };

  const getPlatformUrl = (id: McpPlatform) => {
    return PLATFORMS.find(x => x.id === id)?.url || '#';
  };

  const hasUniversalKey = mcpRouter.isProviderConfigured('google');
  const hasHfKey = mcpRouter.isProviderConfigured('huggingface');

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-white/95 dark:bg-black/90 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl rounded-3xl shadow-2xl dark:shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh] relative ring-1 ring-black/5 dark:ring-white/10"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/80 dark:bg-zinc-900/50 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-lg">
                <Settings size={20} className="text-zinc-600 dark:text-zinc-300" />
            </div>
            <div>
                <h3 className="text-lg font-bold brand-font tracking-wide text-zinc-900 dark:text-zinc-100">SYSTEM SETTINGS</h3>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
                    <span>Luxor9 v1.3.0</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-600"></span>
                    <span className={hasUniversalKey ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-500'}>{hasUniversalKey ? 'CORE ONLINE' : 'CORE OFFLINE'}</span>
                </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black/40">
            {[
                { id: 'keys', label: 'Access Credentials', icon: Key },
                { id: 'mcp', label: 'Neural Nodes (MCP)', icon: Server },
                { id: 'system', label: 'System Diagnostics', icon: Activity },
            ].map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as Tab)}
                    className={`flex items-center gap-2 px-4 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                        activeTab === tab.id 
                        ? 'border-amber-500 text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/5' 
                        : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5'
                    }`}
                >
                    <tab.icon size={14} />
                    {tab.label}
                </button>
            ))}
        </div>

        <div className="p-0 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-black">
          
          {/* --- KEYS TAB --- */}
          {activeTab === 'keys' && (
              <div className="p-6 space-y-6">
                 {/* Status Cards */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${hasUniversalKey ? 'bg-emerald-50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-950/10 border-red-200 dark:border-red-500/20'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${hasUniversalKey ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'}`}>
                                <Cloud size={18} />
                            </div>
                            <div>
                                <div className={`text-xs font-bold uppercase tracking-wider ${hasUniversalKey ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>Core Intelligence</div>
                                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{hasUniversalKey ? 'Gemini 2.5/3.0 Active' : 'API Key Required'}</div>
                            </div>
                        </div>
                        {hasUniversalKey ? <Check size={18} className="text-emerald-500" /> : <ShieldAlert size={18} className="text-red-500" />}
                    </div>

                    <div className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${hasHfKey ? 'bg-amber-50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-500/20' : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${hasHfKey ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}>
                                <Ghost size={18} />
                            </div>
                            <div>
                                <div className={`text-xs font-bold uppercase tracking-wider ${hasHfKey ? 'text-amber-700 dark:text-amber-400' : 'text-zinc-500'}`}>Open Models</div>
                                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{hasHfKey ? 'HuggingFace Token Active' : 'Get Free Token (Open Models)'}</div>
                            </div>
                        </div>
                        {hasHfKey ? <Check size={18} className="text-amber-500" /> : null}
                    </div>
                 </div>

                 {/* Key List */}
                 <div>
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <Key size={12} /> Configured Keys
                        </h4>
                        <button 
                            onClick={() => setIsAdding(true)} 
                            className="flex items-center gap-2 text-[10px] font-bold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-100 dark:text-zinc-200 px-3 py-1.5 rounded-lg transition-all"
                        >
                            <Plus size={12} /> ADD KEY
                        </button>
                    </div>

                    <div className="space-y-2">
                        {/* System Default */}
                        <div 
                          onClick={() => handleSelect(null)}
                          className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all group ${
                            !profiles.some(p => p.isActive) 
                            ? 'bg-zinc-100 dark:bg-zinc-800/80 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 shadow-sm' 
                            : 'bg-zinc-50 dark:bg-zinc-900/40 border-zinc-100 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:border-zinc-200 dark:hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                             <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-950 flex items-center justify-center border border-zinc-300 dark:border-zinc-800 font-mono text-xs text-zinc-600 dark:text-zinc-400">ENV</div>
                             <div>
                                <div className="font-bold text-sm">System Environment</div>
                                <div className="text-[10px] font-mono opacity-60">Uses process.env / .env keys</div>
                             </div>
                          </div>
                          {!profiles.some(p => p.isActive) && <Check size={16} className="text-emerald-500" />}
                        </div>

                        {/* Profiles */}
                        {profiles.map(profile => (
                           <div 
                             key={profile.id}
                             onClick={() => handleSelect(profile.id)}
                             className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all group ${
                               profile.isActive 
                               ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/50 text-amber-900 dark:text-amber-100 shadow-sm' 
                               : 'bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700'
                             }`}
                           >
                             <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-950 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-800">
                                   {getPlatformIcon(profile.platform)}
                                </div>
                                <div>
                                   <div className="flex items-center gap-2">
                                       <span className="font-bold text-sm">{profile.name}</span>
                                       <span className="text-[9px] uppercase tracking-wider bg-black/5 dark:bg-black/40 px-1.5 py-0.5 rounded text-zinc-500 border border-black/5 dark:border-white/5">{profile.platform}</span>
                                   </div>
                                   <div className="text-[10px] opacity-60 font-mono">
                                     {profile.key.substring(0, 12)}••••••••
                                   </div>
                                </div>
                             </div>
                             <div className="flex items-center gap-3">
                                {profile.isActive && <Check size={16} className="text-amber-600 dark:text-amber-500" />}
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDelete(profile.id); }}
                                  className="p-2 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                >
                                   <Trash2 size={14} />
                                </button>
                             </div>
                           </div>
                        ))}
                    </div>

                    {/* Add Mode */}
                    {isAdding && (
                        <div className="mt-4 bg-zinc-100 dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-700 animate-in slide-in-from-top-2">
                           <div className="flex justify-between items-start mb-4">
                                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">New Credential</span>
                                <button onClick={() => setIsAdding(false)} className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"><X size={14}/></button>
                           </div>
                           
                           <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="text-[10px] uppercase text-zinc-500 font-bold mb-1.5 block">Provider</label>
                                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                                        {PLATFORMS.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => setSelectedPlatform(p.id)}
                                                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border transition-all ${
                                                    selectedPlatform === p.id 
                                                    ? 'bg-zinc-200 dark:bg-zinc-800 border-amber-500 text-zinc-900 dark:text-zinc-100 shadow-md' 
                                                    : 'bg-white dark:bg-black border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                                                }`}
                                            >
                                                <p.icon size={16} className={selectedPlatform === p.id ? p.color : 'text-current'} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] uppercase text-zinc-500 font-bold mb-1.5 block">Profile Name</label>
                                        <input 
                                            autoFocus
                                            type="text" 
                                            placeholder="e.g. My Pro Key" 
                                            className="w-full bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm focus:border-amber-500 outline-none transition-all text-zinc-900 dark:text-zinc-100"
                                            value={newName}
                                            onChange={e => setNewName(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase text-zinc-500 font-bold mb-1.5 flex justify-between">
                                            <span>API Key</span>
                                            <a href={getPlatformUrl(selectedPlatform)} target="_blank" rel="noreferrer" className="text-amber-600 dark:text-amber-500 hover:underline flex items-center gap-1">GET KEY <ExternalLink size={8}/></a>
                                        </label>
                                        <input 
                                            type="password" 
                                            placeholder="sk-..." 
                                            className="w-full bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm focus:border-amber-500 outline-none font-mono transition-all text-zinc-900 dark:text-zinc-100"
                                            value={newKey}
                                            onChange={e => setNewKey(e.target.value)}
                                        />
                                    </div>
                                </div>
                                
                                <button onClick={handleAddProfile} disabled={!newKey || !newName} className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-black dark:text-black font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-lg">
                                    SAVE SECURELY
                                </button>
                           </div>
                        </div>
                    )}
                 </div>
              </div>
          )}

          {/* --- MCP TAB --- */}
          {activeTab === 'mcp' && (
              <div className="p-6">
                 <div className="mb-6">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
                        Model Context Protocol (MCP) allows Luxor9 to connect to external tools, databases, and local servers. 
                        Add SSE endpoints to extend agent capabilities.
                    </p>
                    
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2"><Server size={12}/> Active Nodes</span>
                        <button onClick={() => setIsAddingServer(!isAddingServer)} className="text-[10px] text-amber-600 dark:text-amber-500 hover:text-amber-500 font-bold uppercase tracking-wider flex items-center gap-1 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-500/20 transition-all">
                            <Plus size={10} /> ADD REMOTE
                        </button>
                    </div>

                    <div className="space-y-3">
                        {connections.map((conn) => (
                            <div key={conn.id} className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between group hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${conn.status === 'connected' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-500' : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500'}`}>
                                        <Server size={20} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-200">{conn.transport.name}</span>
                                            <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${conn.status === 'connected' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'}`}>{conn.status}</span>
                                        </div>
                                        <div className="text-[10px] text-zinc-500 mt-1 font-mono">{conn.tools.length} Tools • {conn.id}</div>
                                    </div>
                                </div>
                                {conn.id !== 'internal' && (
                                    <button onClick={() => handleDisconnect(conn.id)} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                        
                        {isAddingServer && (
                            <div className="p-4 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl animate-in slide-in-from-top-2">
                                <label className="text-[10px] uppercase text-zinc-500 font-bold mb-2 block">SSE Endpoint URL</label>
                                <div className="flex gap-2">
                                    <input 
                                        autoFocus
                                        type="text" 
                                        placeholder="http://localhost:8080/sse" 
                                        className="flex-1 bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm focus:border-amber-500 outline-none font-mono text-zinc-900 dark:text-zinc-100"
                                        value={newServerUrl}
                                        onChange={(e) => setNewServerUrl(e.target.value)}
                                    />
                                    <button onClick={handleAddServer} className="px-4 bg-amber-600 text-white dark:text-black font-bold rounded-xl text-xs hover:bg-amber-500">
                                        CONNECT
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                 </div>
              </div>
          )}

          {/* --- SYSTEM TAB --- */}
          {activeTab === 'system' && (
              <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                          <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-2">Memory Usage</div>
                          <div className="text-2xl font-mono text-zinc-900 dark:text-zinc-200">{((performance as any).memory?.usedJSHeapSize / 1024 / 1024).toFixed(1) || 'N/A'} MB</div>
                      </div>
                      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                          <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-2">Uptime</div>
                          <div className="text-2xl font-mono text-zinc-900 dark:text-zinc-200">{(performance.now() / 1000).toFixed(0)}s</div>
                      </div>
                  </div>
                  <div className="mt-6 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800">
                      <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2">Capabilities</h4>
                      <div className="flex flex-wrap gap-2">
                          {['WebGL 2.0', 'WebAudio', 'MediaRecorder', 'WebWorkers', 'ServiceWorker'].map(c => (
                              <span key={c} className="px-2 py-1 rounded-md bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-500">{c}</span>
                          ))}
                      </div>
                  </div>
              </div>
          )}

        </div>
      </div>
    </div>
  );
};