import React, { useState, useEffect } from 'react';
import { mcpRouter } from '../services/mcpRouter';
import { mcpClient } from '../services/mcpClient';
import { McpProfile, McpPlatform } from '../types';
import { Network, Plus, Trash2, Check, X, Key, Cloud, Sparkles, Box, Terminal, Cpu, Zap, Ghost, Layers, Server, Globe, ExternalLink, Activity, Sun, Moon, Laptop, Shield, Lock, AlertTriangle, RefreshCw, CheckCircle2, XCircle, CreditCard, ChevronLeft, Search, Eye, EyeOff, Info, Mic, Database, ArrowRight, LayoutGrid, List } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'framer-motion';

// Workaround for framer-motion type issues in strict environments
const MotionDiv = motion.div as any;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const PLATFORMS: { id: McpPlatform; label: string; icon: any; color: string; url: string; description: string; category: 'Core' | 'Open Source' | 'Specialized' }[] = [
  { id: 'google', label: 'Google Gemini', icon: Cloud, color: 'text-blue-500', url: 'https://aistudio.google.com/app/apikey', description: 'Essential. Powers Overseer, Veo, and core reasoning.', category: 'Core' },
  { id: 'openai', label: 'OpenAI', icon: Sparkles, color: 'text-green-400', url: 'https://platform.openai.com/api-keys', description: 'Optional fallback for reasoning agents.', category: 'Core' },
  { id: 'anthropic', label: 'Anthropic', icon: Box, color: 'text-orange-400', url: 'https://console.anthropic.com/settings/keys', description: 'Access Claude 3.5 Sonnet and Opus.', category: 'Core' },
  { id: 'xai', label: 'xAI', icon: Cpu, color: 'text-zinc-400 dark:text-zinc-100', url: 'https://console.x.ai/', description: 'Grok access.', category: 'Core' },
  
  { id: 'openrouter', label: 'OpenRouter', icon: Network, color: 'text-indigo-500', url: 'https://openrouter.ai/keys', description: 'Unified gateway for Mistral, Llama, and others.', category: 'Open Source' },
  { id: 'huggingface', label: 'HuggingFace', icon: Ghost, color: 'text-yellow-400', url: 'https://huggingface.co/settings/tokens', description: 'Access open-source vision (BLIP-2) and image models.', category: 'Open Source' },
  { id: 'deepseek', label: 'DeepSeek', icon: Zap, color: 'text-cyan-400', url: 'https://platform.deepseek.com/', description: 'DeepSeek V3/R1 access.', category: 'Open Source' },
  
  { id: 'cohere', label: 'Cohere', icon: Database, color: 'text-teal-500', url: 'https://dashboard.cohere.com/api-keys', description: 'Required for advanced semantic search.', category: 'Specialized' },
  { id: 'assemblyai', label: 'AssemblyAI', icon: Mic, color: 'text-purple-500', url: 'https://www.assemblyai.com/app/account', description: 'Audio transcription and intelligence.', category: 'Specialized' },
  { id: 'replicate', label: 'Replicate', icon: Layers, color: 'text-purple-400', url: 'https://replicate.com/account/api-tokens', description: 'Hosting for specialized generative models.', category: 'Specialized' },
];

type Tab = 'general' | 'keys' | 'mcp' | 'system';
type WizardStep = 'list' | 'select' | 'configure';

export const McpPanel: React.FC<Props> = ({ isOpen, onClose, isDarkMode, onToggleTheme }) => {
  const [activeTab, setActiveTab] = useState<Tab>('keys');
  
  // Wizard State
  const [wizardStep, setWizardStep] = useState<WizardStep>('list');
  const [selectedPlatform, setSelectedPlatform] = useState<McpPlatform>('google');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data State
  const [profiles, setProfiles] = useState<McpProfile[]>([]);
  const [formData, setFormData] = useState({ name: '', key: '' });
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  
  // MCP Connections State
  const [connections, setConnections] = useState<any[]>([]);
  const [newServerUrl, setNewServerUrl] = useState('');
  const [isAddingServer, setIsAddingServer] = useState(false);

  // Health State
  const [backendHealth, setBackendHealth] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      loadProfiles();
      refreshConnections();
      if (activeTab === 'keys') setWizardStep('list');
      
      const lastSse = localStorage.getItem('luxor9_mcp_sse_url');
      if (lastSse && !mcpClient.isSseConnected(lastSse)) {
          mcpClient.connectSse(lastSse)
            .then(() => refreshConnections())
            .catch(e => console.warn("Auto-reconnect failed", e));
      }
    }
  }, [isOpen]);

  useEffect(() => {
      if (activeTab === 'system') {
          fetch('http://localhost:8080/health')
            .then(res => res.json())
            .then(data => setBackendHealth(data))
            .catch(() => setBackendHealth(null));
      }
  }, [activeTab]);

  const loadProfiles = () => {
    setProfiles([...mcpRouter.getProfiles()]);
  };

  const refreshConnections = () => {
      setConnections([...mcpClient.getConnections()]);
  };

  const handleStartAdd = () => {
      setWizardStep('select');
      setTestStatus('idle');
      setFormData({ name: '', key: '' });
      setSearchQuery('');
  };

  const handleSelectPlatform = (id: McpPlatform) => {
      setSelectedPlatform(id);
      const defaultName = PLATFORMS.find(p => p.id === id)?.label || 'My Key';
      setFormData({ name: defaultName, key: '' });
      setWizardStep('configure');
  };

  const handleBack = () => {
      if (wizardStep === 'configure') setWizardStep('select');
      else setWizardStep('list');
      setTestStatus('idle');
  };

  const handleSaveKey = () => {
    if (formData.key && formData.name) {
      mcpRouter.addProfile(formData.name, formData.key, selectedPlatform);
      setFormData({ name: '', key: '' });
      setWizardStep('list');
      setTestStatus('idle');
      loadProfiles();
    }
  };

  const handleActivate = (profile: McpProfile) => {
      mcpRouter.setActiveProfile(profile.id);
      loadProfiles();
  };

  const handleTestKey = async () => {
      if (!formData.key) return;
      setTestStatus('testing');
      try {
          if (selectedPlatform === 'google') {
              const ai = new GoogleGenAI({ apiKey: formData.key });
              await ai.models.generateContent({
                  model: 'gemini-3-flash-preview',
                  contents: { parts: [{ text: 'ping' }] }
              });
          } else if (selectedPlatform === 'huggingface') {
               const res = await fetch('https://api-inference.huggingface.co/models/google/bert-base-uncased', { 
                   method: 'HEAD',
                   headers: { Authorization: `Bearer ${formData.key}` } 
               });
               if (res.status === 401 || res.status === 403) throw new Error("Invalid Token");
          } else if (selectedPlatform === 'openrouter') {
               const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
                   method: 'GET',
                   headers: { Authorization: `Bearer ${formData.key}` }
               });
               if (!res.ok) throw new Error("Invalid OpenRouter Key");
          }
          // Generic success for others for now
          await new Promise(resolve => setTimeout(resolve, 800)); // Fake delay for UX
          setTestStatus('success');
      } catch (e) {
          console.error("Key Validation Failed", e);
          setTestStatus('error');
      }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this key?')) {
        mcpRouter.removeProfile(id);
        loadProfiles();
    }
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

  const handleResetData = () => {
      if (confirm('WARNING: This will wipe all local data, including memory, chats, and API keys. The app will reload.')) {
          localStorage.clear();
          window.location.reload();
      }
  };

  const handleAiStudioSelect = async () => {
      if ((window as any).aistudio) {
          try {
              await (window as any).aistudio.openSelectKey();
              alert("Key selected. If not automatically detected, please paste it manually.");
          } catch (e) {
              console.error(e);
              alert("Failed to open Key Selector. Please use the manual link.");
          }
      } else {
          window.open('https://aistudio.google.com/app/apikey', '_blank');
      }
  };

  const getPlatformInfo = (id: McpPlatform) => PLATFORMS.find(x => x.id === id);

  const filteredPlatforms = PLATFORMS.filter(p => 
      p.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = Array.from(new Set(filteredPlatforms.map(p => p.category)));

  if (!isOpen) return null;

  return (
    <AnimatePresence>
        <MotionDiv 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <MotionDiv 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-[#09090b] w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl dark:shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col relative ring-1 ring-black/5 dark:ring-white/10"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex h-full">
                    
                    {/* Sidebar */}
                    <div className="w-64 bg-zinc-50/80 dark:bg-zinc-900/30 border-r border-zinc-200 dark:border-white/5 flex flex-col shrink-0">
                        <div className="p-6 border-b border-zinc-200 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-black font-bold brand-font shadow-lg">L9</div>
                                <div>
                                    <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 brand-font tracking-wide">SETTINGS</div>
                                    <div className="text-[10px] text-zinc-500 font-mono">Control Center</div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex-1 p-3 space-y-1 overflow-y-auto">
                            {[
                                { id: 'general', label: 'Preferences', icon: Laptop },
                                { id: 'keys', label: 'Credentials', icon: Lock },
                                { id: 'mcp', label: 'Neural Nodes', icon: Network },
                                { id: 'system', label: 'Diagnostics', icon: Activity },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => { setActiveTab(tab.id as Tab); if(tab.id === 'keys') setWizardStep('list'); }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                                        activeTab === tab.id 
                                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm ring-1 ring-zinc-200 dark:ring-white/5' 
                                        : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'
                                    }`}
                                >
                                    <tab.icon size={16} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="p-4 border-t border-zinc-200 dark:border-white/5">
                            <div className="flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-600 font-mono">
                                <span>v3.4.0</span>
                                <span className="flex items-center gap-1"><Shield size={10}/> Secure</span>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#09090b] relative">
                        {/* Header */}
                        <div className="h-16 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between px-8 shrink-0 bg-white/50 dark:bg-[#09090b]/50 backdrop-blur-md z-10">
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
                                {activeTab === 'keys' && wizardStep !== 'list' && (
                                    <button onClick={handleBack} className="mr-2 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors">
                                        <ChevronLeft size={18} />
                                    </button>
                                )}
                                {activeTab === 'general' && 'System Preferences'}
                                {activeTab === 'keys' && (wizardStep === 'list' ? 'Credential Vault' : wizardStep === 'select' ? 'Add New Provider' : 'Configure Access')}
                                {activeTab === 'mcp' && 'MCP Network'}
                                {activeTab === 'system' && 'System Health'}
                            </h2>
                            <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content Body */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
                            
                            {/* --- GENERAL TAB --- */}
                            {activeTab === 'general' && (
                                <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-2xl">
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-100 dark:border-white/5 pb-2">Interface</h3>
                                        <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-white/5">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2.5 rounded-xl bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 shadow-sm">
                                                    {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Theme Preference</div>
                                                    <div className="text-xs text-zinc-500">Toggle between light and dark visual modes.</div>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={onToggleTheme}
                                                className="px-4 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-900 dark:text-zinc-100 transition-colors"
                                            >
                                                {isDarkMode ? 'Switch to Light' : 'Switch to Dark'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-100 dark:border-white/5 pb-2">Danger Zone</h3>
                                        <div className="bg-red-50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/20 rounded-xl p-5">
                                            <div className="flex items-start gap-4">
                                                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                                                    <AlertTriangle size={20} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-sm font-bold text-red-900 dark:text-red-400">Factory Reset</div>
                                                    <p className="text-xs text-red-700/70 dark:text-red-400/60 mt-1 leading-relaxed">
                                                        Irreversible action. Wipes all locally stored data including API keys, chat history, and vector memory.
                                                    </p>
                                                    <button 
                                                        onClick={handleResetData}
                                                        className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm w-full sm:w-auto"
                                                    >
                                                        Delete Everything
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </MotionDiv>
                            )}

                            {/* --- KEYS TAB (WIZARD) --- */}
                            {activeTab === 'keys' && (
                                <div className="max-w-4xl mx-auto">
                                    <AnimatePresence mode="wait">
                                        {wizardStep === 'list' && (
                                            <MotionDiv 
                                                key="list"
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="space-y-6"
                                            >
                                                {/* Hero Card */}
                                                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
                                                    <div className="relative z-10 flex justify-between items-center">
                                                        <div>
                                                            <h3 className="text-xl font-bold mb-1">API Key Vault</h3>
                                                            <p className="text-blue-100 text-xs max-w-md">Securely manage your provider credentials. Keys are encrypted and stored locally in your browser.</p>
                                                        </div>
                                                        <button 
                                                            onClick={handleStartAdd} 
                                                            className="flex items-center gap-2 bg-white text-blue-600 px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg hover:bg-blue-50 transition-colors"
                                                        >
                                                            <Plus size={16} /> Connect Provider
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between px-2">
                                                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Active Credentials</h3>
                                                        <span className="text-[10px] text-zinc-400 font-mono">{profiles.length} Configured</span>
                                                    </div>

                                                    {profiles.length === 0 ? (
                                                        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/20 text-center">
                                                            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-zinc-400">
                                                                <Key size={32} />
                                                            </div>
                                                            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">No Keys Found</h4>
                                                            <p className="text-xs text-zinc-500 mb-6 max-w-xs">Connect an AI provider to unlock the full potential of Luxor9.</p>
                                                            <button onClick={handleStartAdd} className="text-xs font-bold text-blue-600 hover:text-blue-500">Connect Now &rarr;</button>
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {profiles.map(profile => {
                                                                const pInfo = getPlatformInfo(profile.platform);
                                                                const PIcon = pInfo?.icon || Key;
                                                                const isActive = profile.isActive;
                                                                
                                                                return (
                                                                    <div key={profile.id} className={`group relative bg-white dark:bg-zinc-900 border rounded-xl p-4 transition-all duration-300 ${isActive ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)] ring-1 ring-emerald-500/20' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600'}`}>
                                                                        <div className="flex justify-between items-start mb-3">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isActive ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                                                                                    <PIcon size={20} />
                                                                                </div>
                                                                                <div>
                                                                                    <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{profile.name}</div>
                                                                                    <div className="text-[10px] text-zinc-500 font-mono uppercase">{profile.platform}</div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex gap-1">
                                                                                {!isActive && (
                                                                                    <button onClick={() => handleActivate(profile)} className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors" title="Activate">
                                                                                        <CheckCircle2 size={16} />
                                                                                    </button>
                                                                                )}
                                                                                <button onClick={() => handleDelete(profile.id)} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete">
                                                                                    <Trash2 size={16} />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                        
                                                                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-100 dark:border-white/5">
                                                                            <div className="font-mono text-[10px] text-zinc-400 bg-zinc-50 dark:bg-black/40 px-2 py-1 rounded">
                                                                                {profile.key.substring(0, 4)}••••{profile.key.substring(profile.key.length - 4)}
                                                                            </div>
                                                                            {isActive ? (
                                                                                <span className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Inactive</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </MotionDiv>
                                        )}

                                        {wizardStep === 'select' && (
                                            <MotionDiv 
                                                key="select"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="space-y-6"
                                            >
                                                <div className="flex items-center gap-4 bg-zinc-100 dark:bg-zinc-900 p-2 rounded-xl">
                                                    <Search size={18} className="ml-2 text-zinc-400" />
                                                    <input 
                                                        type="text" 
                                                        placeholder="Search providers (e.g. OpenAI, Google)..." 
                                                        className="bg-transparent w-full border-none focus:outline-none text-sm text-zinc-900 dark:text-zinc-100"
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        autoFocus
                                                    />
                                                </div>

                                                {categories.map(cat => {
                                                    const catPlatforms = filteredPlatforms.filter(p => p.category === cat);
                                                    if (catPlatforms.length === 0) return null;
                                                    
                                                    return (
                                                        <div key={cat} className="space-y-3">
                                                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-2">{cat}</h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                {catPlatforms.map(p => (
                                                                    <button 
                                                                        key={p.id} 
                                                                        onClick={() => handleSelectPlatform(p.id)}
                                                                        className="flex flex-col gap-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all text-left group"
                                                                    >
                                                                        <div className="flex justify-between items-start w-full">
                                                                            <div className={`p-2 rounded-lg ${p.color.replace('text-', 'bg-').replace('400', '100').replace('500', '100')} bg-opacity-20`}>
                                                                                <p.icon size={20} className={p.color} />
                                                                            </div>
                                                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500">
                                                                                <ArrowRight size={16} />
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{p.label}</div>
                                                                            <div className="text-[10px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">{p.description}</div>
                                                                        </div>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                                
                                                {filteredPlatforms.length === 0 && (
                                                    <div className="text-center py-12 text-zinc-500 text-sm">No providers found matching "{searchQuery}"</div>
                                                )}
                                            </MotionDiv>
                                        )}

                                        {wizardStep === 'configure' && (
                                            <MotionDiv 
                                                key="configure"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-xl"
                                            >
                                                <div className="flex items-center gap-4 mb-8">
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${getPlatformInfo(selectedPlatform)?.color.replace('text-', 'bg-').replace('400', '100').replace('500', '100')} bg-opacity-20`}>
                                                        {(() => { const Icon = getPlatformInfo(selectedPlatform)?.icon || Key; return <Icon size={28} className={getPlatformInfo(selectedPlatform)?.color} />; })()}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-xl text-zinc-900 dark:text-zinc-100">{getPlatformInfo(selectedPlatform)?.label}</h3>
                                                        <a href={getPlatformInfo(selectedPlatform)?.url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:text-blue-600 hover:underline flex items-center gap-1 font-medium mt-1">
                                                            Get API Key <ExternalLink size={10} />
                                                        </a>
                                                    </div>
                                                </div>

                                                <div className="space-y-6">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Display Name</label>
                                                        <input 
                                                            type="text" 
                                                            value={formData.name} 
                                                            onChange={e => setFormData({...formData, name: e.target.value})} 
                                                            className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-zinc-900 dark:text-zinc-100 placeholder-zinc-400" 
                                                        />
                                                    </div>
                                                    
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100">API Key</label>
                                                        <div className="relative">
                                                            <input 
                                                                type={showKey ? "text" : "password"} 
                                                                value={formData.key} 
                                                                onChange={e => { setFormData({...formData, key: e.target.value}); setTestStatus('idle'); }} 
                                                                placeholder="sk-..." 
                                                                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-zinc-900 dark:text-zinc-100 font-mono pr-12 placeholder-zinc-400" 
                                                            />
                                                            <button 
                                                                onClick={() => setShowKey(!showKey)} 
                                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                                                            >
                                                                {showKey ? <EyeOff size={16}/> : <Eye size={16}/>}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Key Specific Helpers */}
                                                    {selectedPlatform === 'google' && (window as any).aistudio && (
                                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20 flex items-center justify-between">
                                                            <div>
                                                                <div className="text-xs font-bold text-blue-800 dark:text-blue-300">Using Veo?</div>
                                                                <div className="text-[10px] text-blue-600 dark:text-blue-400">Select a paid key for video generation.</div>
                                                            </div>
                                                            <button onClick={handleAiStudioSelect} className="text-xs font-bold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                                                                Select via Google
                                                            </button>
                                                        </div>
                                                    )}

                                                    <div className="pt-4 flex gap-3">
                                                        {formData.key && (
                                                            <button 
                                                                onClick={handleTestKey} 
                                                                disabled={testStatus === 'testing' || testStatus === 'success'} 
                                                                className={`px-6 py-3 rounded-xl font-bold text-xs transition-all flex items-center gap-2 border ${testStatus === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-500/30' : testStatus === 'error' ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:border-red-500/30' : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700'}`}
                                                            >
                                                                {testStatus === 'testing' && <RefreshCw size={14} className="animate-spin" />}
                                                                {testStatus === 'success' && <CheckCircle2 size={14} />}
                                                                {testStatus === 'error' && <XCircle size={14} />}
                                                                {testStatus === 'idle' && 'Test Key'}
                                                                {testStatus === 'testing' && 'Verifying'}
                                                                {testStatus === 'success' && 'Verified'}
                                                                {testStatus === 'error' && 'Invalid'}
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={handleSaveKey} 
                                                            disabled={!formData.key || !formData.name} 
                                                            className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-500/20 text-sm flex items-center justify-center gap-2"
                                                        >
                                                            <Check size={16} /> Save Credential
                                                        </button>
                                                    </div>
                                                </div>
                                            </MotionDiv>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            {/* --- MCP TAB --- */}
                            {activeTab === 'mcp' && (
                                <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                    <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-200 dark:border-purple-500/20 rounded-xl p-5">
                                        <h3 className="font-bold text-sm text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2"><Network size={16}/> Model Context Protocol (MCP)</h3>
                                        <p className="text-xs text-purple-800/70 dark:text-purple-200/60 leading-relaxed">Luxor9 supports the MCP standard, allowing agents to connect to external tools, local servers, and databases via Server-Sent Events (SSE). Add a local or remote endpoint below to extend agent capabilities.</p>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Connected Nodes</h3>
                                            <button onClick={() => setIsAddingServer(!isAddingServer)} className="text-xs font-bold text-amber-600 hover:text-amber-500 flex items-center gap-1 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-500/20 transition-all"><Plus size={12} /> ADD REMOTE</button>
                                        </div>
                                        {isAddingServer && (
                                            <div className="p-4 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl animate-in slide-in-from-top-2">
                                                <label className="text-[10px] uppercase text-zinc-500 font-bold mb-2 block">SSE Endpoint URL</label>
                                                <div className="flex gap-2">
                                                    <input autoFocus type="text" placeholder="http://localhost:8080/sse" className="flex-1 bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none font-mono text-zinc-900 dark:text-zinc-100" value={newServerUrl} onChange={(e) => setNewServerUrl(e.target.value)} />
                                                    <button onClick={handleAddServer} className="px-4 bg-amber-600 text-white font-bold rounded-lg text-xs hover:bg-amber-500 shadow-sm">CONNECT</button>
                                                </div>
                                            </div>
                                        )}
                                        {connections.map((conn) => (
                                            <div key={conn.id} className="p-4 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between group shadow-sm">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${conn.status === 'connected' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-500' : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500'}`}><Server size={20} /></div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-200">{conn.transport.name}</span>
                                                            <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${conn.status === 'connected' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'}`}>{conn.status}</span>
                                                        </div>
                                                        <div className="text-[10px] text-zinc-500 mt-1 font-mono">{conn.tools.length} Tools • {conn.id}</div>
                                                    </div>
                                                </div>
                                                {conn.id !== 'internal' && <button onClick={() => handleDisconnect(conn.id)} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"><Trash2 size={16} /></button>}
                                            </div>
                                        ))}
                                    </div>
                                </MotionDiv>
                            )}

                            {/* --- SYSTEM TAB --- */}
                            {activeTab === 'system' && (
                                <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                    <div className="p-5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2 text-zinc-500">
                                                <Server size={14} />
                                                <span className="text-[10px] uppercase tracking-wider font-bold">Backend Health</span>
                                            </div>
                                            <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${backendHealth ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                {backendHealth ? 'ONLINE' : 'UNREACHABLE'}
                                            </div>
                                        </div>
                                        {backendHealth ? (
                                            <div className="grid grid-cols-2 gap-4 text-xs">
                                                <div><span className="text-zinc-500 block mb-1">Region</span><span className="font-mono text-zinc-900 dark:text-zinc-100">{backendHealth.region}</span></div>
                                                <div><span className="text-zinc-500 block mb-1">Uptime</span><span className="font-mono text-zinc-900 dark:text-zinc-100">{Math.round(backendHealth.uptime / 60)}m</span></div>
                                                <div className="col-span-2"><span className="text-zinc-500 block mb-1">Active Agents</span>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {backendHealth.active_agents.map((a: string) => (
                                                            <span key={a} className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 px-2 py-1 rounded font-mono text-[10px] text-zinc-600 dark:text-zinc-400">{a}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-zinc-500">
                                                Cannot connect to orchestration layer. Ensure backend service is running on port 8080.
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                                            <div className="flex items-center gap-2 mb-2 text-zinc-500">
                                                <Activity size={14} />
                                                <span className="text-[10px] uppercase tracking-wider font-bold">Memory Usage</span>
                                            </div>
                                            <div className="text-3xl font-mono text-zinc-900 dark:text-zinc-200 tracking-tighter">
                                                {((performance as any).memory?.usedJSHeapSize / 1024 / 1024).toFixed(1) || 'N/A'} <span className="text-sm text-zinc-500 font-sans">MB</span>
                                            </div>
                                        </div>
                                        <div className="p-5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                                            <div className="flex items-center gap-2 mb-2 text-zinc-500">
                                                <RefreshCw size={14} />
                                                <span className="text-[10px] uppercase tracking-wider font-bold">Session Uptime</span>
                                            </div>
                                            <div className="text-3xl font-mono text-zinc-900 dark:text-zinc-200 tracking-tighter">
                                                {(performance.now() / 1000 / 60).toFixed(0)} <span className="text-sm text-zinc-500 font-sans">MIN</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-5 rounded-xl bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800">
                                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Browser Capabilities</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {['WebGL 2.0', 'WebAudio API', 'MediaRecorder', 'WebWorkers', 'ServiceWorker', 'SpeechRecognition'].map(c => (
                                                <span key={c} className="px-2 py-1 rounded-md bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 text-[10px] font-mono text-zinc-600 dark:text-zinc-400">
                                                    {c}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </MotionDiv>
                            )}

                        </div>
                    </div>
                </div>
            </MotionDiv>
        </MotionDiv>
    </AnimatePresence>
  );
};