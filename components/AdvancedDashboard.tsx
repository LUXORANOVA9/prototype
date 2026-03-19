import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitMerge, Plug, Key, Radio, Globe, Users, Activity, Shield,
  Check, X, Settings, Play, Pause, Download, Upload, RefreshCw,
  Zap, Database, Network, Lock, Eye, EyeOff, Copy, ExternalLink,
  Server, Layers, Workflow, MessageSquare, Hash, Clock, Star,
  ChevronRight, Plus, Trash2, Send, Wifi, WifiOff
} from 'lucide-react';

import CRDTManager from '../services/crdtEngine';
import PluginManager from '../services/pluginArchitecture';
import NostrManager from '../services/nostrIntegration';

// --- Main Advanced Dashboard ---
export default function AdvancedDashboard() {
  const [activeTab, setActiveTab] = useState<'crdt' | 'plugins' | 'nostr'>('crdt');

  // CRDT State
  const crdtManager = CRDTManager.getInstance();
  const [crdtStats, setCrdtStats] = useState(crdtManager.getStats());
  const [crdtDocs, setCrdtDocs] = useState<string[]>([]);

  // Plugin State
  const pluginManager = PluginManager.getInstance();
  const [plugins, setPlugins] = useState(pluginManager.getPlugins());
  const [pluginStats, setPluginStats] = useState(pluginManager.getStats());
  const [executions, setExecutions] = useState<any[]>([]);

  // Nostr State
  const nostrManager = NostrManager.getInstance();
  const [nostrStats, setNostrStats] = useState(nostrManager.getStats());
  const [relays, setRelays] = useState(nostrManager.getRelays());
  const [nostrEvents, setNostrEvents] = useState<any[]>([]);
  const [agentIdentities, setAgentIdentities] = useState(nostrManager.getAgentIdentities());

  // Refresh state
  useEffect(() => {
    const interval = setInterval(() => {
      setCrdtStats(crdtManager.getStats());
      setPlugins(pluginManager.getPlugins());
      setPluginStats(pluginManager.getStats());
      setExecutions(pluginManager.getExecutions({ limit: 10 }));
      setNostrStats(nostrManager.getStats());
      setRelays(nostrManager.getRelays());
      setAgentIdentities(nostrManager.getAgentIdentities());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Create CRDT doc
  const createCRDTDoc = () => {
    const docId = `doc-${Date.now()}`;
    crdtManager.getOrCreateDocument(docId, 'text');
    setCrdtDocs(prev => [...prev, docId]);
  };

  // Execute plugin tool
  const executeTool = async (pluginId: string, toolId: string) => {
    await pluginManager.executeTool(pluginId, toolId, {}, 'dashboard-user');
  };

  // Generate Nostr keys
  const generateNostrKeys = () => {
    nostrManager.generateKeys();
    setNostrStats(nostrManager.getStats());
  };

  // Connect to Nostr relays
  const connectRelays = () => {
    nostrManager.connectToRelays();
  };

  // Create agent identity
  const createAgentIdentity = (agentId: string) => {
    nostrManager.createAgentIdentity(agentId, `${agentId} Agent`, `Autonomous ${agentId} agent on Luxor9`);
    setAgentIdentities(nostrManager.getAgentIdentities());
  };

  return (
    <div className="flex flex-col h-full bg-[#02050A] text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
            <Layers size={16} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold">Advanced Systems</div>
            <div className="text-[10px] text-white/30 font-mono">CRDTs · PLUGINS · NOSTR</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 shrink-0">
        {[
          { id: 'crdt' as const, label: 'CRDTs', icon: GitMerge, desc: 'Real-time Collab' },
          { id: 'plugins' as const, label: 'Plugins', icon: Plug, desc: 'MCP Tools' },
          { id: 'nostr' as const, label: 'Nostr', icon: Key, desc: 'Decentralized ID' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'text-violet-400 border-b border-violet-500 bg-violet-500/5'
                : 'text-white/30 hover:text-white/50'
            }`}
          >
            <tab.icon size={14} />
            <div className="text-left hidden md:block">
              <div>{tab.label}</div>
              <div className="text-[8px] text-white/20 normal-case">{tab.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* CRDT Tab */}
        {activeTab === 'crdt' && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-violet-400">{crdtStats.documents}</div>
                <div className="text-[9px] text-white/25 font-mono">Documents</div>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{crdtStats.sessions}</div>
                <div className="text-[9px] text-white/25 font-mono">Sessions</div>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-emerald-400">{crdtStats.totalOperations}</div>
                <div className="text-[9px] text-white/25 font-mono">Operations</div>
              </div>
            </div>

            {/* Create Document */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Collaborative Documents</div>
                <button
                  onClick={createCRDTDoc}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-400 text-[10px] font-mono hover:bg-violet-500/20 cursor-pointer"
                >
                  <Plus size={12} /> New Doc
                </button>
              </div>
              {crdtDocs.length === 0 ? (
                <div className="text-center text-white/15 text-[11px] py-6">
                  No documents yet. Create one to start collaborating.
                </div>
              ) : (
                <div className="space-y-2">
                  {crdtDocs.map(docId => {
                    const doc = crdtManager.getDocument(docId);
                    return (
                      <div key={docId} className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-lg">
                        <GitMerge size={14} className="text-violet-400" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium">{docId}</div>
                          <div className="text-[9px] text-white/25 font-mono">v{doc?.getVersion() || 0} · {doc?.type || 'text'}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-[9px] text-white/20 font-mono">synced</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* How it works */}
            <div className="bg-violet-500/5 border border-violet-500/10 rounded-xl p-4">
              <div className="text-[10px] font-mono text-violet-400 uppercase tracking-wider mb-2">How CRDTs Work</div>
              <p className="text-[11px] text-white/40 leading-relaxed">
                Conflict-free Replicated Data Types allow multiple users to edit the same document simultaneously
                without conflicts. Each operation is timestamped and merged using Last-Writer-Wins semantics.
                No central server needed — works offline and syncs when connected.
              </p>
            </div>
          </div>
        )}

        {/* Plugins Tab */}
        {activeTab === 'plugins' && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-blue-400">{pluginStats.totalPlugins}</div>
                <div className="text-[8px] text-white/25 font-mono">Plugins</div>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-emerald-400">{pluginStats.activePlugins}</div>
                <div className="text-[8px] text-white/25 font-mono">Active</div>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-amber-400">{pluginStats.totalTools}</div>
                <div className="text-[8px] text-white/25 font-mono">Tools</div>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-purple-400">{pluginStats.totalExecutions}</div>
                <div className="text-[8px] text-white/25 font-mono">Runs</div>
              </div>
            </div>

            {/* Plugin List */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Installed Plugins</div>
              {plugins.map(plugin => (
                <div key={plugin.manifest.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{plugin.manifest.name}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono ${
                          plugin.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                          plugin.status === 'error' ? 'bg-red-500/10 text-red-500' :
                          'bg-white/5 text-white/30'
                        }`}>
                          {plugin.status}
                        </span>
                        <span className="text-[9px] text-white/20 font-mono">v{plugin.manifest.version}</span>
                      </div>
                      <p className="text-[10px] text-white/30 mt-0.5">{plugin.manifest.description}</p>
                    </div>
                    <span className="text-[9px] text-white/15 font-mono">{plugin.usageCount} uses</span>
                  </div>

                  {/* Tools */}
                  <div className="mt-2">
                    <div className="text-[8px] text-white/15 font-mono uppercase tracking-wider mb-1">Tools ({plugin.manifest.tools.length})</div>
                    <div className="flex flex-wrap gap-1.5">
                      {plugin.manifest.tools.map(tool => (
                        <button
                          key={tool.id}
                          onClick={() => executeTool(plugin.manifest.id, tool.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-[9px] text-white/40 hover:bg-blue-500/10 hover:text-blue-400 transition-all cursor-pointer"
                        >
                          <Play size={8} /> {tool.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Permissions */}
                  {plugin.manifest.permissions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {plugin.manifest.permissions.map((perm, i) => (
                        <span key={i} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/5 text-[8px] text-amber-500/60 font-mono">
                          <Shield size={8} /> {perm.type}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Recent Executions */}
            {executions.length > 0 && (
              <div>
                <div className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-2">Recent Executions</div>
                <div className="space-y-1.5">
                  {executions.map(exec => (
                    <div key={exec.id} className="flex items-center gap-3 p-2 bg-white/[0.02] border border-white/5 rounded-lg text-[10px]">
                      <div className={`w-2 h-2 rounded-full ${
                        exec.status === 'completed' ? 'bg-emerald-500' :
                        exec.status === 'failed' ? 'bg-red-500' :
                        'bg-amber-500 animate-pulse'
                      }`} />
                      <span className="text-white/50 flex-1">{exec.pluginId}/{exec.toolId}</span>
                      <span className="text-white/20 font-mono">{exec.duration ? `${exec.duration}ms` : '...'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Nostr Tab */}
        {activeTab === 'nostr' && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center">
                <div className="text-xl font-bold">{nostrStats.hasIdentity ? <Check className="text-emerald-400 mx-auto" /> : <Key className="text-white/20 mx-auto" />}</div>
                <div className="text-[8px] text-white/25 font-mono mt-1">Identity</div>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-blue-400">{nostrStats.connectedRelays}/{nostrStats.totalRelays}</div>
                <div className="text-[8px] text-white/25 font-mono">Relays</div>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-purple-400">{nostrStats.totalEvents}</div>
                <div className="text-[8px] text-white/25 font-mono">Events</div>
              </div>
            </div>

            {/* Identity */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
              <div className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-3">Nostr Identity</div>
              {nostrStats.hasIdentity ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Key size={14} className="text-violet-400" />
                    <span className="text-xs font-mono text-white/60">{nostrManager.getKeys()?.npub}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(nostrManager.getKeys()?.publicKey || '')}
                      className="p-1 hover:bg-white/5 rounded cursor-pointer"
                    >
                      <Copy size={10} className="text-white/30" />
                    </button>
                  </div>
                  <div className="text-[9px] text-emerald-500 flex items-center gap-1">
                    <Check size={10} /> Keys generated and ready
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <button
                    onClick={generateNostrKeys}
                    className="px-4 py-2 rounded-xl bg-violet-500/10 text-violet-400 text-xs font-semibold hover:bg-violet-500/20 cursor-pointer"
                  >
                    Generate Nostr Keys
                  </button>
                  <div className="text-[9px] text-white/20 mt-2">Create a decentralized identity for your agents</div>
                </div>
              )}
            </div>

            {/* Relays */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Relay Network</div>
                <button
                  onClick={connectRelays}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-400 text-[10px] font-mono hover:bg-violet-500/20 cursor-pointer"
                >
                  <Wifi size={12} /> Connect All
                </button>
              </div>
              <div className="space-y-1.5">
                {relays.map(relay => (
                  <div key={relay.url} className="flex items-center gap-3 p-2 bg-white/[0.02] border border-white/5 rounded-lg">
                    <div className={`w-2 h-2 rounded-full ${
                      relay.status === 'connected' ? 'bg-emerald-500' :
                      relay.status === 'connecting' ? 'bg-amber-500 animate-pulse' :
                      relay.status === 'error' ? 'bg-red-500' :
                      'bg-white/15'
                    }`} />
                    <span className="text-[10px] text-white/50 font-mono flex-1 truncate">{relay.url}</span>
                    <div className="flex items-center gap-2 text-[8px] text-white/20">
                      {relay.read && <Eye size={10} />}
                      {relay.write && <Send size={10} />}
                      <span>{relay.eventCount} events</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Agent Identities */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Agent Identities</div>
                <div className="flex gap-1">
                  {['OVERSEER', 'DEVELOPER', 'VISIONARY'].map(agentId => (
                    <button
                      key={agentId}
                      onClick={() => createAgentIdentity(agentId)}
                      className="px-2 py-1 rounded bg-white/5 text-[8px] text-white/30 font-mono hover:bg-violet-500/10 hover:text-violet-400 cursor-pointer"
                    >
                      +{agentId.split('_')[0]}
                    </button>
                  ))}
                </div>
              </div>
              {agentIdentities.length === 0 ? (
                <div className="text-center text-white/15 text-[11px] py-4">
                  No agent identities created yet
                </div>
              ) : (
                <div className="space-y-1.5">
                  {agentIdentities.map(identity => (
                    <div key={identity.agentId} className="flex items-center gap-3 p-2 bg-white/[0.02] border border-white/5 rounded-lg">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-[10px] font-bold text-violet-400">
                        {identity.agentId.slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-medium">{identity.displayName}</div>
                        <div className="text-[8px] text-white/25 font-mono truncate">{identity.nostrPubkey.slice(0, 16)}...</div>
                      </div>
                      {identity.verified && <Check size={12} className="text-emerald-500" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* How it works */}
            <div className="bg-violet-500/5 border border-violet-500/10 rounded-xl p-4">
              <div className="text-[10px] font-mono text-violet-400 uppercase tracking-wider mb-2">Decentralized Identity</div>
              <p className="text-[11px] text-white/40 leading-relaxed">
                Nostr provides decentralized identity for your agents. Each agent can have its own keypair,
                publish events to relay networks, and interact with the broader Nostr ecosystem.
                Supports NIP-01 (basic protocol), NIP-04 (encrypted DMs), and NIP-05 (verified identity).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 bg-black/40 text-[9px] font-mono text-white/20">
        <div className="flex items-center gap-4">
          <span>CRDTs: {crdtStats.documents} docs</span>
          <span>Plugins: {pluginStats.activePlugins} active</span>
          <span>Nostr: {nostrStats.connectedRelays} relays</span>
        </div>
        <span>Advanced Systems v1.0</span>
      </div>
    </div>
  );
}
