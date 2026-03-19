import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PenTool, Mic, MicOff, Image, Sparkles, Clock, Tag, Trash2, Pin, PinOff,
  Search, Plus, Moon, Sun, Cloud, Zap, Brain, Heart, Coffee, Star,
  ChevronDown, Send, X, BookOpen, Feather, Lightbulb, Target
} from 'lucide-react';

// --- Types ---
interface DreamEntry {
  id: string;
  content: string;
  type: 'thought' | 'idea' | 'voice' | 'sketch' | 'dream';
  mood: 'energized' | 'calm' | 'creative' | 'focused' | 'tired' | 'inspired';
  tags: string[];
  isPinned: boolean;
  timestamp: number;
  aiSummary?: string;
  relatedEntries?: string[];
}

// --- Mood Icons ---
const MOOD_CONFIG: Record<DreamEntry['mood'], { icon: React.ElementType; color: string; label: string }> = {
  energized: { icon: Zap, color: '#eab308', label: 'Energized' },
  calm: { icon: Cloud, color: '#3b82f6', label: 'Calm' },
  creative: { icon: Sparkles, color: '#a855f7', label: 'Creative' },
  focused: { icon: Target, color: '#22c55e', label: 'Focused' },
  tired: { icon: Moon, color: '#6366f1', label: 'Tired' },
  inspired: { icon: Star, color: '#f59e0b', label: 'Inspired' },
};

const TYPE_CONFIG: Record<DreamEntry['type'], { icon: React.ElementType; color: string; label: string }> = {
  thought: { icon: Brain, color: '#94a3b8', label: 'Thought' },
  idea: { icon: Lightbulb, color: '#f59e0b', label: 'Idea' },
  voice: { icon: Mic, color: '#3b82f6', label: 'Voice Note' },
  sketch: { icon: PenTool, color: '#ec4899', label: 'Sketch' },
  dream: { icon: Moon, color: '#a855f7', label: 'Dream' },
};

// --- Initial Entries ---
const INITIAL_ENTRIES: DreamEntry[] = [
  {
    id: 'e1', content: 'What if agents could learn from each other? Like a hive mind where one agent discovers a better prompt pattern and shares it with the collective.', type: 'idea', mood: 'creative', tags: ['agents', 'learning'], isPinned: true, timestamp: Date.now() - 3600000,
  },
  {
    id: 'e2', content: 'Build a feature where the Overseer writes a daily report summarizing what all agents accomplished. A factory newspaper.', type: 'thought', mood: 'focused', tags: ['feature', 'reporting'], isPinned: false, timestamp: Date.now() - 7200000,
  },
  {
    id: 'e3', content: 'Dreamed about a city where buildings were made of code. Each floor was a function, elevators were API calls, and the people were data flowing through the streets.', type: 'dream', mood: 'inspired', tags: ['dream', 'metaphor'], isPinned: false, timestamp: Date.now() - 86400000,
  },
  {
    id: 'e4', content: 'Quick idea: what if the Factory Floor shows a heat map of agent activity over time? You could see which agents are busiest during certain hours.', type: 'idea', mood: 'energized', tags: ['visualization', 'analytics'], isPinned: true, timestamp: Date.now() - 172800000,
  },
];

// --- Entry Card ---
function EntryCard({ entry, onPin, onDelete, onAnalyze }: {
  entry: DreamEntry;
  onPin: () => void;
  onDelete: () => void;
  onAnalyze: () => void;
}) {
  const MoodIcon = MOOD_CONFIG[entry.mood].icon;
  const TypeIcon = TYPE_CONFIG[entry.type].icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      layout
      className={`group relative p-4 rounded-xl border transition-all cursor-default ${
        entry.isPinned
          ? 'bg-amber-500/5 border-amber-500/15'
          : 'bg-white/[0.02] border-white/5 hover:border-white/10'
      }`}
    >
      {/* Pin indicator */}
      {entry.isPinned && (
        <div className="absolute top-3 right-3">
          <Pin size={12} className="text-amber-500 fill-amber-500" />
        </div>
      )}

      {/* Type & Mood */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono" style={{ background: `${TYPE_CONFIG[entry.type].color}10`, color: TYPE_CONFIG[entry.type].color }}>
          <TypeIcon size={10} />
          {TYPE_CONFIG[entry.type].label}
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono" style={{ background: `${MOOD_CONFIG[entry.mood].color}10`, color: MOOD_CONFIG[entry.mood].color }}>
          <MoodIcon size={10} />
          {MOOD_CONFIG[entry.mood].label}
        </div>
      </div>

      {/* Content */}
      <p className="text-sm text-white/70 leading-relaxed mb-3">{entry.content}</p>

      {/* AI Summary */}
      {entry.aiSummary && (
        <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg px-3 py-2 mb-3">
          <div className="text-[8px] text-amber-500/60 font-mono uppercase tracking-wider mb-1">AI Summary</div>
          <p className="text-[11px] text-white/50">{entry.aiSummary}</p>
        </div>
      )}

      {/* Tags */}
      <div className="flex items-center gap-2 flex-wrap">
        {entry.tags.map(tag => (
          <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 text-[9px] text-white/30 font-mono">
            <Tag size={8} /> {tag}
          </span>
        ))}
      </div>

      {/* Timestamp */}
      <div className="flex items-center gap-1 mt-2 text-[9px] text-white/20 font-mono">
        <Clock size={9} />
        {new Date(entry.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </div>

      {/* Actions (on hover) */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onPin} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer">
          {entry.isPinned ? <PinOff size={11} className="text-amber-500" /> : <Pin size={11} className="text-white/40" />}
        </button>
        <button onClick={onAnalyze} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer">
          <Sparkles size={11} className="text-amber-500/60" />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/10 cursor-pointer">
          <Trash2 size={11} className="text-white/40 hover:text-red-400" />
        </button>
      </div>
    </motion.div>
  );
}

// --- Main Dream Journal ---
export default function DreamJournal() {
  const [entries, setEntries] = useState<DreamEntry[]>(INITIAL_ENTRIES);
  const [input, setInput] = useState('');
  const [entryType, setEntryType] = useState<DreamEntry['type']>('thought');
  const [mood, setMood] = useState<DreamEntry['mood']>('calm');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<DreamEntry['type'] | 'all'>('all');
  const [isRecording, setIsRecording] = useState(false);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Filtered entries
  const filteredEntries = entries
    .filter(e => {
      if (filterType !== 'all' && e.type !== filterType) return false;
      if (searchQuery && !e.content.toLowerCase().includes(searchQuery.toLowerCase()) && !e.tags.some(t => t.includes(searchQuery.toLowerCase()))) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.timestamp - a.timestamp;
    });

  const handleSubmit = () => {
    if (!input.trim()) return;
    const newEntry: DreamEntry = {
      id: `e-${Date.now()}`,
      content: input.trim(),
      type: entryType,
      mood,
      tags: tags.length > 0 ? tags : ['uncategorized'],
      isPinned: false,
      timestamp: Date.now(),
    };
    setEntries(prev => [newEntry, ...prev]);
    setInput('');
    setTags([]);
    setTagInput('');
    setShowNewEntry(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags(prev => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  };

  const togglePin = (id: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, isPinned: !e.isPinned } : e));
  };

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const analyzeEntry = (id: string) => {
    const summaries = [
      'This idea could enhance agent collaboration. Consider implementing as a shared knowledge base.',
      'Interesting concept. This aligns with the Factory Floor visualization goals.',
      'Strong creative insight. Worth exploring as a narrative engine feature.',
      'Practical idea that could improve user engagement metrics.',
    ];
    setEntries(prev => prev.map(e =>
      e.id === id ? { ...e, aiSummary: summaries[Math.floor(Math.random() * summaries.length)] } : e
    ));
  };

  // Stats
  const stats = {
    total: entries.length,
    pinned: entries.filter(e => e.isPinned).length,
    ideas: entries.filter(e => e.type === 'idea').length,
    dreams: entries.filter(e => e.type === 'dream').length,
  };

  return (
    <div className="flex flex-col h-full bg-[#02050A] text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Feather size={16} className="text-purple-500" />
          </div>
          <div>
            <div className="text-sm font-semibold">Dream Journal</div>
            <div className="text-[10px] text-white/30 font-mono">THOUGHT CAPTURE & NEURAL CORE</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Stats */}
          <div className="hidden md:flex items-center gap-3 mr-2 text-[9px] font-mono text-white/25">
            <span>{stats.total} entries</span>
            <span>{stats.pinned} pinned</span>
            <span>{stats.ideas} ideas</span>
          </div>

          <button
            onClick={() => setShowNewEntry(!showNewEntry)}
            className="p-2 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-all cursor-pointer"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* New Entry Panel */}
      <AnimatePresence>
        {showNewEntry && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-white/5 bg-black/30 overflow-hidden shrink-0"
          >
            <div className="p-4 space-y-3">
              {/* Type & Mood selectors */}
              <div className="flex gap-2">
                <div className="flex gap-1 flex-wrap">
                  {Object.entries(TYPE_CONFIG).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => setEntryType(key as DreamEntry['type'])}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-mono transition-all cursor-pointer ${
                          entryType === key
                            ? 'bg-white/10 text-white'
                            : 'bg-white/5 text-white/30 hover:text-white/50'
                        }`}
                      >
                        <Icon size={10} style={{ color: config.color }} />
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-1 flex-wrap">
                {Object.entries(MOOD_CONFIG).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => setMood(key as DreamEntry['mood'])}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-mono transition-all cursor-pointer ${
                        mood === key
                          ? 'text-white'
                          : 'text-white/30 hover:text-white/50'
                      }`}
                      style={{ background: mood === key ? `${config.color}15` : 'transparent' }}
                    >
                      <Icon size={10} style={{ color: config.color }} />
                      {config.label}
                    </button>
                  );
                })}
              </div>

              {/* Text input */}
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What's on your mind? Capture a thought, idea, or dream..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/30 resize-none"
              />

              {/* Tags */}
              <div className="flex items-center gap-2">
                <div className="flex gap-1 flex-wrap flex-1">
                  {tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 text-[9px] text-white/40">
                      {tag}
                      <button onClick={() => setTags(prev => prev.filter(t => t !== tag))} className="cursor-pointer">
                        <X size={8} />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    placeholder="Add tag..."
                    className="bg-transparent text-[10px] text-white/40 placeholder:text-white/15 focus:outline-none w-20"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!input.trim()}
                  className="p-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-white/5 disabled:text-white/20 text-black rounded-xl transition-all cursor-pointer"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 shrink-0">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search thoughts..."
            className="w-full bg-white/5 border border-white/5 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-white/10"
          />
        </div>

        <div className="flex gap-1">
          {['all', 'thought', 'idea', 'dream', 'voice'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type as any)}
              className={`px-2 py-1 rounded-lg text-[9px] font-mono capitalize transition-all cursor-pointer ${
                filterType === type ? 'bg-white/10 text-white' : 'text-white/25 hover:text-white/40'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Entries List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredEntries.map(entry => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onPin={() => togglePin(entry.id)}
              onDelete={() => deleteEntry(entry.id)}
              onAnalyze={() => analyzeEntry(entry.id)}
            />
          ))}
        </AnimatePresence>

        {filteredEntries.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-white/15 gap-3">
            <BookOpen size={32} className="opacity-30" />
            <div className="text-sm">No entries found</div>
            <div className="text-[10px]">Start capturing your thoughts</div>
          </div>
        )}
      </div>

      {/* Quick Capture Bar (bottom) */}
      <div className="px-4 py-3 border-t border-white/5 bg-black/30 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`p-2.5 rounded-xl transition-all cursor-pointer ${
              isRecording ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-white/5 text-white/30 hover:bg-white/10'
            }`}
          >
            {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          <button className="p-2.5 rounded-xl bg-white/5 text-white/30 hover:bg-white/10 transition-all cursor-pointer">
            <Image size={16} />
          </button>
          <button className="p-2.5 rounded-xl bg-white/5 text-white/30 hover:bg-white/10 transition-all cursor-pointer">
            <PenTool size={16} />
          </button>
          <div className="flex-1">
            <input
              type="text"
              placeholder="Quick capture..."
              className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/20"
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                  const val = (e.target as HTMLInputElement).value.trim();
                  setEntries(prev => [{
                    id: `e-${Date.now()}`,
                    content: val,
                    type: 'thought',
                    mood: 'calm',
                    tags: ['quick-capture'],
                    isPinned: false,
                    timestamp: Date.now(),
                  }, ...prev]);
                  (e.target as HTMLInputElement).value = '';
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
