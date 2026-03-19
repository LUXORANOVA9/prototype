import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, Search, Star, Download, Upload, Plus, Heart, Share2, Eye,
  Filter, Tag, TrendingUp, Clock, Award, Zap, Brain, Code, Globe,
  Image, Mic, Film, BarChart3, Users, Network, MapPin, Server,
  Shield, Check, X, ChevronRight, ExternalLink, Sparkles, Crown,
  ArrowUpDown, Grid, List, ShoppingBag
} from 'lucide-react';

// --- Types ---
interface MarketplaceAgent {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  category: string;
  author: string;
  authorAvatar: string;
  version: string;
  rating: number;
  reviews: number;
  downloads: number;
  price: number; // 0 = free
  isInstalled: boolean;
  isFeatured: boolean;
  isVerified: boolean;
  tags: string[];
  capabilities: string[];
  createdAt: number;
  updatedAt: number;
}

// --- Agent Data ---
const MARKETPLACE_AGENTS: MarketplaceAgent[] = [
  {
    id: 'mp-1', name: 'Code Architect', description: 'Advanced code generation with architecture patterns. Generates production-ready code with tests, docs, and deployment configs.',
    icon: Code, color: '#3b82f6', category: 'Development', author: 'Luxor9 Labs', authorAvatar: 'L9',
    version: '2.1.0', rating: 4.9, reviews: 234, downloads: 12400, price: 0,
    isInstalled: true, isFeatured: true, isVerified: true,
    tags: ['code', 'architecture', 'testing'], capabilities: ['React', 'Node.js', 'Python', 'Go', 'Rust'],
    createdAt: Date.now() - 86400000 * 30, updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'mp-2', name: 'Vision Pro', description: 'State-of-the-art image generation and analysis. Creates photorealistic images, edits existing ones, and performs deep visual analysis.',
    icon: Image, color: '#a855f7', category: 'Creative', author: 'ArtisanAI', authorAvatar: 'AI',
    version: '3.0.1', rating: 4.8, reviews: 567, downloads: 34200, price: 9.99,
    isInstalled: false, isFeatured: true, isVerified: true,
    tags: ['image', 'generation', 'analysis'], capabilities: ['Photorealistic', 'Style Transfer', 'Inpainting', 'Upscaling'],
    createdAt: Date.now() - 86400000 * 60, updatedAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'mp-3', name: 'Data Scientist', description: 'Automated data analysis, visualization, and ML model training. Handles CSV, JSON, SQL databases, and real-time streams.',
    icon: BarChart3, color: '#06b6d4', category: 'Analytics', author: 'DataFlow', authorAvatar: 'DF',
    version: '1.5.2', rating: 4.7, reviews: 189, downloads: 8900, price: 4.99,
    isInstalled: false, isFeatured: false, isVerified: true,
    tags: ['data', 'ml', 'visualization'], capabilities: ['Pandas', 'Charts', 'ML Training', 'SQL'],
    createdAt: Date.now() - 86400000 * 45, updatedAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'mp-4', name: 'Voice Commander', description: 'Full voice control with speech-to-text, text-to-speech, and voice cloning. Supports 40+ languages.',
    icon: Mic, color: '#f97316', category: 'Communication', author: 'VoiceLab', authorAvatar: 'VL',
    version: '2.0.0', rating: 4.6, reviews: 312, downloads: 15600, price: 7.99,
    isInstalled: false, isFeatured: true, isVerified: false,
    tags: ['voice', 'stt', 'tts'], capabilities: ['Speech Recognition', 'Voice Synthesis', 'Translation', 'Cloning'],
    createdAt: Date.now() - 86400000 * 20, updatedAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'mp-5', name: 'Film Director', description: 'AI-powered video generation and editing. Create cinematic scenes, edit footage, add effects, and generate storyboards.',
    icon: Film, color: '#ec4899', category: 'Creative', author: 'CineAI', authorAvatar: 'CA',
    version: '1.2.0', rating: 4.5, reviews: 98, downloads: 5400, price: 14.99,
    isInstalled: false, isFeatured: false, isVerified: true,
    tags: ['video', 'cinema', 'editing'], capabilities: ['Text-to-Video', 'Scene Composition', 'Storyboarding'],
    createdAt: Date.now() - 86400000 * 15, updatedAt: Date.now() - 86400000 * 7,
  },
  {
    id: 'mp-6', name: 'Web Researcher', description: 'Deep web research with source verification, fact-checking, and citation generation. Browses and extracts structured data.',
    icon: Globe, color: '#22c55e', category: 'Research', author: 'SearchAI', authorAvatar: 'SA',
    version: '1.8.3', rating: 4.8, reviews: 421, downloads: 21300, price: 0,
    isInstalled: true, isFeatured: false, isVerified: true,
    tags: ['research', 'web', 'facts'], capabilities: ['Web Scraping', 'Fact Check', 'Citations', 'Summaries'],
    createdAt: Date.now() - 86400000 * 90, updatedAt: Date.now() - 86400000 * 4,
  },
  {
    id: 'mp-7', name: 'Security Auditor', description: 'Automated security audits for code, infrastructure, and APIs. OWASP compliance, vulnerability scanning, and remediation.',
    icon: Shield, color: '#ef4444', category: 'Security', author: 'SecureStack', authorAvatar: 'SS',
    version: '2.3.1', rating: 4.9, reviews: 156, downloads: 7800, price: 19.99,
    isInstalled: false, isFeatured: false, isVerified: true,
    tags: ['security', 'audit', 'compliance'], capabilities: ['OWASP Scan', 'Vulnerability Detection', 'Code Review'],
    createdAt: Date.now() - 86400000 * 50, updatedAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'mp-8', name: 'Geo Navigator', description: 'Geospatial intelligence with mapping, route optimization, location analysis, and satellite imagery processing.',
    icon: MapPin, color: '#14b8a6', category: 'Specialist', author: 'GeoTech', authorAvatar: 'GT',
    version: '1.1.0', rating: 4.3, reviews: 67, downloads: 3200, price: 5.99,
    isInstalled: false, isFeatured: false, isVerified: false,
    tags: ['geo', 'maps', 'routes'], capabilities: ['Mapping', 'Route Optimization', 'Location Analysis'],
    createdAt: Date.now() - 86400000 * 10, updatedAt: Date.now() - 86400000 * 8,
  },
];

// --- Star Rating ---
function StarRating({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(rating) ? 'text-amber-500 fill-amber-500' : 'text-white/10'}
        />
      ))}
    </div>
  );
}

// --- Agent Card ---
function AgentCard({ agent, onInstall, onUninstall, onView }: {
  agent: MarketplaceAgent;
  onInstall: () => void;
  onUninstall: () => void;
  onView: () => void;
}) {
  const Icon = agent.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-all cursor-pointer"
      onClick={onView}
    >
      {/* Featured badge */}
      {agent.isFeatured && (
        <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[8px] font-mono text-amber-500 uppercase tracking-wider z-10">
          <Crown size={8} /> Featured
        </div>
      )}

      {/* Verified badge */}
      {agent.isVerified && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center z-10">
          <Check size={10} className="text-blue-500" />
        </div>
      )}

      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${agent.color}10`, border: `1px solid ${agent.color}20` }}
          >
            <Icon size={22} style={{ color: agent.color }} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold truncate">{agent.name}</h3>
              <span className="text-[9px] text-white/20 font-mono">v{agent.version}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-white/30">by {agent.author}</span>
              <span className="text-white/10">·</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/25">{agent.category}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="px-4 pb-3">
        <p className="text-[11px] text-white/40 leading-relaxed line-clamp-2">{agent.description}</p>
      </div>

      {/* Tags */}
      <div className="px-4 pb-3 flex flex-wrap gap-1">
        {agent.tags.slice(0, 3).map(tag => (
          <span key={tag} className="px-1.5 py-0.5 rounded bg-white/5 text-[8px] text-white/25 font-mono">{tag}</span>
        ))}
      </div>

      {/* Stats */}
      <div className="px-4 pb-3 flex items-center gap-3 text-[10px] text-white/25">
        <div className="flex items-center gap-1">
          <StarRating rating={agent.rating} size={10} />
          <span className="text-white/40">{agent.rating}</span>
          <span>({agent.reviews})</span>
        </div>
        <div className="flex items-center gap-1">
          <Download size={10} />
          {agent.downloads.toLocaleString()}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 bg-white/[0.01]">
        <div className="text-sm font-semibold">
          {agent.price === 0 ? (
            <span className="text-emerald-500">Free</span>
          ) : (
            <span>${agent.price}</span>
          )}
        </div>

        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          {agent.isInstalled ? (
            <button
              onClick={onUninstall}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-red-500/10 hover:text-red-400 text-[10px] font-mono transition-all cursor-pointer"
            >
              <X size={11} /> Installed
            </button>
          ) : (
            <button
              onClick={onInstall}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 text-[10px] font-mono transition-all cursor-pointer"
            >
              <Download size={11} /> Install
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// --- Agent Detail Modal ---
function AgentDetail({ agent, onClose, onInstall, onUninstall }: {
  agent: MarketplaceAgent;
  onClose: () => void;
  onInstall: () => void;
  onUninstall: () => void;
}) {
  const Icon = agent.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 pb-4" style={{ background: `linear-gradient(135deg, ${agent.color}08, transparent)` }}>
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 cursor-pointer">
            <X size={16} />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${agent.color}15`, border: `1px solid ${agent.color}25` }}>
              <Icon size={28} style={{ color: agent.color }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{agent.name}</h2>
                {agent.isVerified && <Check size={16} className="text-blue-500" />}
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm text-white/40">
                <span>by {agent.author}</span>
                <span>·</span>
                <span>v{agent.version}</span>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <StarRating rating={agent.rating} />
                <span className="text-sm text-white/50">{agent.rating} ({agent.reviews} reviews)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-white/60 leading-relaxed">{agent.description}</p>

          {/* Capabilities */}
          <div>
            <div className="text-[10px] text-white/30 font-mono uppercase tracking-wider mb-2">Capabilities</div>
            <div className="flex flex-wrap gap-1.5">
              {agent.capabilities.map(cap => (
                <span key={cap} className="px-2.5 py-1 rounded-lg bg-white/5 text-[11px] text-white/50">{cap}</span>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center">
              <div className="text-lg font-bold">{(agent.downloads / 1000).toFixed(1)}k</div>
              <div className="text-[9px] text-white/30 font-mono">Downloads</div>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center">
              <div className="text-lg font-bold">{agent.reviews}</div>
              <div className="text-[9px] text-white/30 font-mono">Reviews</div>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center">
              <div className="text-lg font-bold">{new Date(agent.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
              <div className="text-[9px] text-white/30 font-mono">Updated</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-white/5">
          <div className="text-2xl font-bold">
            {agent.price === 0 ? <span className="text-emerald-500">Free</span> : <span>${agent.price}</span>}
          </div>
          {agent.isInstalled ? (
            <button onClick={onUninstall} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-semibold transition-all cursor-pointer">
              <X size={16} /> Uninstall
            </button>
          ) : (
            <button onClick={onInstall} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 text-black hover:bg-amber-400 text-sm font-semibold transition-all cursor-pointer">
              <Download size={16} /> {agent.price === 0 ? 'Install Free' : `Buy $${agent.price}`}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- Main Marketplace ---
export default function AgentMarketplace() {
  const [agents, setAgents] = useState<MarketplaceAgent[]>(MARKETPLACE_AGENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'newest' | 'price'>('popular');
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedAgent, setSelectedAgent] = useState<MarketplaceAgent | null>(null);

  const categories = useMemo(() => {
    const cats = [...new Set(agents.map(a => a.category))];
    return ['all', ...cats];
  }, [agents]);

  const filteredAgents = useMemo(() => {
    let result = agents;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.tags.some(t => t.includes(q))
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter(a => a.category === selectedCategory);
    }

    if (showFreeOnly) {
      result = result.filter(a => a.price === 0);
    }

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'popular': return b.downloads - a.downloads;
        case 'rating': return b.rating - a.rating;
        case 'newest': return b.createdAt - a.createdAt;
        case 'price': return a.price - b.price;
        default: return 0;
      }
    });

    return result;
  }, [agents, searchQuery, selectedCategory, sortBy, showFreeOnly]);

  const installAgent = (id: string) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, isInstalled: true, downloads: a.downloads + 1 } : a));
  };

  const uninstallAgent = (id: string) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, isInstalled: false } : a));
  };

  const installedCount = agents.filter(a => a.isInstalled).length;

  return (
    <div className="flex flex-col h-full bg-[#02050A] text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Store size={16} className="text-emerald-500" />
          </div>
          <div>
            <div className="text-sm font-semibold">Agent Marketplace</div>
            <div className="text-[10px] text-white/30 font-mono">{agents.length} AGENTS · {installedCount} INSTALLED</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-500 text-[10px] font-mono hover:bg-amber-500/20 transition-all cursor-pointer">
            <Upload size={12} /> Publish Agent
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 shrink-0 flex-wrap">
        <div className="flex-1 relative min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search agents..."
            className="w-full bg-white/5 border border-white/5 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-white/10"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-1 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-1 rounded-lg text-[9px] font-mono capitalize transition-all cursor-pointer ${
                selectedCategory === cat ? 'bg-white/10 text-white' : 'text-white/25 hover:text-white/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-white/40 focus:outline-none cursor-pointer"
        >
          <option value="popular">Most Popular</option>
          <option value="rating">Highest Rated</option>
          <option value="newest">Newest</option>
          <option value="price">Price: Low to High</option>
        </select>

        {/* Free toggle */}
        <button
          onClick={() => setShowFreeOnly(!showFreeOnly)}
          className={`px-2 py-1 rounded-lg text-[9px] font-mono transition-all cursor-pointer ${
            showFreeOnly ? 'bg-emerald-500/10 text-emerald-500' : 'text-white/25 hover:text-white/40'
          }`}
        >
          Free Only
        </button>
      </div>

      {/* Featured Section */}
      {selectedCategory === 'all' && !searchQuery && (
        <div className="px-4 py-3 border-b border-white/5 bg-gradient-to-r from-amber-500/5 to-transparent shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={12} className="text-amber-500" />
            <span className="text-[10px] font-mono text-amber-500 uppercase tracking-wider">Featured</span>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {agents.filter(a => a.isFeatured).map(agent => {
              const Icon = agent.icon;
              return (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all cursor-pointer shrink-0"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${agent.color}15` }}>
                    <Icon size={16} style={{ color: agent.color }} />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-medium">{agent.name}</div>
                    <div className="text-[9px] text-white/30">{agent.downloads.toLocaleString()} downloads</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Agent Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className={`grid gap-3 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          <AnimatePresence mode="popLayout">
            {filteredAgents.map(agent => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onInstall={() => installAgent(agent.id)}
                onUninstall={() => uninstallAgent(agent.id)}
                onView={() => setSelectedAgent(agent)}
              />
            ))}
          </AnimatePresence>
        </div>

        {filteredAgents.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-white/15 gap-3">
            <ShoppingBag size={32} className="opacity-30" />
            <div className="text-sm">No agents found</div>
            <div className="text-[10px]">Try adjusting your filters</div>
          </div>
        )}
      </div>

      {/* Agent Detail Modal */}
      <AnimatePresence>
        {selectedAgent && (
          <AgentDetail
            agent={selectedAgent}
            onClose={() => setSelectedAgent(null)}
            onInstall={() => { installAgent(selectedAgent.id); }}
            onUninstall={() => { uninstallAgent(selectedAgent.id); }}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 bg-black/40 text-[9px] font-mono text-white/20">
        <span>{filteredAgents.length} agents shown</span>
        <span>Luxor9 Agent Marketplace</span>
      </div>
    </div>
  );
}
