import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, ChevronRight, ChevronDown, Plus, Edit3, Trash2, Check,
  Circle, Clock, Sparkles, Target, Flag, Star, ArrowRight, Zap,
  FileText, Image, Code, MessageSquare, Layers, GitBranch, Award
} from 'lucide-react';

// --- Types ---
interface StoryChapter {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  status: 'locked' | 'active' | 'completed';
  icon: React.ElementType;
  color: string;
  milestones: Milestone[];
  startedAt?: number;
  completedAt?: number;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  type: 'task' | 'deliverable' | 'decision' | 'review';
  assignee?: string;
  completedAt?: number;
}

// --- Story Data ---
const STORY_CHAPTERS: StoryChapter[] = [
  {
    id: 'ch1', number: 1, title: 'The Discovery', subtitle: 'Understanding the problem space',
    status: 'completed', icon: Sparkles, color: '#22c55e',
    milestones: [
      { id: 'm1', title: 'Define the vision', description: 'What are we building and why?', status: 'completed', type: 'decision', completedAt: Date.now() - 86400000 * 7 },
      { id: 'm2', title: 'Research landscape', description: 'Competitive analysis and user research', status: 'completed', type: 'task', assignee: 'Researcher', completedAt: Date.now() - 86400000 * 6 },
      { id: 'm3', title: 'Document requirements', description: 'Core features and constraints', status: 'completed', type: 'deliverable', completedAt: Date.now() - 86400000 * 5 },
    ],
    startedAt: Date.now() - 86400000 * 7,
    completedAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'ch2', number: 2, title: 'The Foundation', subtitle: 'Building the architecture',
    status: 'completed', icon: Layers, color: '#3b82f6',
    milestones: [
      { id: 'm4', title: 'Design system architecture', description: 'Frontend + Backend + Database', status: 'completed', type: 'decision', assignee: 'Overseer', completedAt: Date.now() - 86400000 * 4 },
      { id: 'm5', title: 'Set up development environment', description: 'Vite, Tailwind, Express, SQLite', status: 'completed', type: 'task', assignee: 'Developer', completedAt: Date.now() - 86400000 * 3 },
      { id: 'm6', title: 'Create component library', description: 'GlassButton, VideoBackground, HeroContent', status: 'completed', type: 'deliverable', assignee: 'Developer', completedAt: Date.now() - 86400000 * 2 },
    ],
    startedAt: Date.now() - 86400000 * 4,
    completedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'ch3', number: 3, title: 'The Assembly', subtitle: 'Agents come online',
    status: 'active', icon: GitBranch, color: '#f59e0b',
    milestones: [
      { id: 'm7', title: 'Build ChatBoard', description: 'Full chat interface with auth', status: 'completed', type: 'deliverable', assignee: 'Developer', completedAt: Date.now() - 86400000 * 1 },
      { id: 'm8', title: 'Create Factory Floor', description: 'Real-time agent visualization', status: 'completed', type: 'deliverable', assignee: 'Developer', completedAt: Date.now() - 3600000 },
      { id: 'm9', title: 'Agent Playground', description: 'Visual workflow builder', status: 'in_progress', type: 'task', assignee: 'Developer' },
      { id: 'm10', title: 'Dream Journal', description: 'Thought capture system', status: 'in_progress', type: 'task', assignee: 'Developer' },
    ],
    startedAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'ch4', number: 4, title: 'The Connection', subtitle: 'Agents talking to each other',
    status: 'locked', icon: Zap, color: '#a855f7',
    milestones: [
      { id: 'm11', title: 'Inter-agent communication', description: 'Agents delegate and collaborate', status: 'pending', type: 'task' },
      { id: 'm12', title: 'Memory Palace', description: '3D visualization of neural core', status: 'pending', type: 'deliverable' },
      { id: 'm13', title: 'Voice-first interface', description: 'Talk to the Overseer', status: 'pending', type: 'task' },
    ],
  },
  {
    id: 'ch5', number: 5, title: 'The Launch', subtitle: 'Your story begins',
    status: 'locked', icon: Award, color: '#ec4899',
    milestones: [
      { id: 'm14', title: 'Full-stack deployment', description: 'Production on Coolify', status: 'pending', type: 'deliverable' },
      { id: 'm15', title: 'Performance optimization', description: 'Lighthouse score > 90', status: 'pending', type: 'review' },
      { id: 'm16', title: 'Public launch', description: 'Share with the world', status: 'pending', type: 'decision' },
    ],
  },
];

// --- Milestone Badge ---
function MilestoneBadge({ type }: { type: Milestone['type'] }) {
  const config = {
    task: { icon: Circle, color: '#3b82f6', label: 'Task' },
    deliverable: { icon: FileText, color: '#22c55e', label: 'Deliverable' },
    decision: { icon: Target, color: '#f59e0b', label: 'Decision' },
    review: { icon: Star, color: '#a855f7', label: 'Review' },
  };
  const { icon: Icon, color, label } = config[type];
  return (
    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[7px] font-mono uppercase" style={{ background: `${color}10`, color }}>
      <Icon size={8} /> {label}
    </span>
  );
}

// --- Progress Ring ---
function ProgressRing({ progress, size = 40, strokeWidth = 3, color }: { progress: number; size?: number; strokeWidth?: number; color: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000"
      />
    </svg>
  );
}

// --- Chapter Card ---
function ChapterCard({ chapter, isExpanded, onToggle, onMilestoneToggle }: {
  chapter: StoryChapter;
  isExpanded: boolean;
  onToggle: () => void;
  onMilestoneToggle: (milestoneId: string) => void;
}) {
  const Icon = chapter.icon;
  const completedCount = chapter.milestones.filter(m => m.status === 'completed').length;
  const progress = chapter.milestones.length > 0 ? (completedCount / chapter.milestones.length) * 100 : 0;

  const statusStyles = {
    locked: 'opacity-40',
    active: '',
    completed: '',
  };

  return (
    <motion.div
      layout
      className={`relative ${statusStyles[chapter.status]}`}
    >
      {/* Timeline connector */}
      <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/5 to-transparent" />

      <div className="relative pl-14">
        {/* Timeline dot */}
        <div
          className="absolute left-4 top-5 w-5 h-5 rounded-full border-2 flex items-center justify-center z-10"
          style={{
            borderColor: chapter.status === 'locked' ? 'rgba(255,255,255,0.1)' : chapter.color,
            background: chapter.status === 'completed' ? chapter.color : '#02050A',
          }}
        >
          {chapter.status === 'completed' && <Check size={10} className="text-black" />}
          {chapter.status === 'active' && (
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: chapter.color }} />
          )}
          {chapter.status === 'locked' && (
            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
          )}
        </div>

        {/* Card */}
        <div
          className={`border rounded-xl overflow-hidden transition-all cursor-pointer ${
            chapter.status === 'active'
              ? 'bg-white/[0.02] border-white/10'
              : chapter.status === 'completed'
              ? 'bg-white/[0.01] border-white/5'
              : 'bg-transparent border-white/[0.03]'
          }`}
          onClick={onToggle}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: `${chapter.color}10`, border: `1px solid ${chapter.color}20` }}
              >
                <Icon size={16} style={{ color: chapter.color }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-white/30 uppercase tracking-wider">Chapter {chapter.number}</span>
                  {chapter.status === 'active' && (
                    <span className="px-1.5 py-0.5 rounded text-[7px] font-mono bg-amber-500/10 text-amber-500 uppercase">Current</span>
                  )}
                </div>
                <div className="text-sm font-semibold">{chapter.title}</div>
                <div className="text-[10px] text-white/30">{chapter.subtitle}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Progress */}
              <div className="relative">
                <ProgressRing progress={progress} size={36} strokeWidth={2} color={chapter.color} />
                <div className="absolute inset-0 flex items-center justify-center text-[9px] font-mono text-white/50">
                  {Math.round(progress)}%
                </div>
              </div>

              <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronRight size={16} className="text-white/20" />
              </motion.div>
            </div>
          </div>

          {/* Milestones (expandable) */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-white/5"
              >
                <div className="p-3 space-y-2">
                  {chapter.milestones.map((milestone, idx) => (
                    <div
                      key={milestone.id}
                      className={`flex items-start gap-3 p-2 rounded-lg transition-all ${
                        milestone.status === 'completed' ? 'opacity-50' : ''
                      } hover:bg-white/[0.02]`}
                      onClick={(e) => { e.stopPropagation(); onMilestoneToggle(milestone.id); }}
                    >
                      {/* Status checkbox */}
                      <button className="mt-0.5 cursor-pointer">
                        {milestone.status === 'completed' ? (
                          <Check size={14} className="text-emerald-500" />
                        ) : milestone.status === 'in_progress' ? (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-500 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          </div>
                        ) : milestone.status === 'blocked' ? (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-red-500" />
                        ) : (
                          <Circle size={14} className="text-white/15" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium ${milestone.status === 'completed' ? 'line-through text-white/30' : 'text-white/80'}`}>
                            {milestone.title}
                          </span>
                          <MilestoneBadge type={milestone.type} />
                        </div>
                        <div className="text-[10px] text-white/25 mt-0.5">{milestone.description}</div>
                        {milestone.assignee && (
                          <div className="text-[9px] text-white/20 font-mono mt-1">
                            Assigned: {milestone.assignee}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// --- Main Narrative Engine ---
export default function NarrativeEngine() {
  const [chapters, setChapters] = useState<StoryChapter[]>(STORY_CHAPTERS);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set(['ch3']));
  const [view, setView] = useState<'timeline' | 'kanban'>('timeline');

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  };

  const toggleMilestone = (milestoneId: string) => {
    setChapters(prev => prev.map(ch => ({
      ...ch,
      milestones: ch.milestones.map(m => {
        if (m.id !== milestoneId) return m;
        const nextStatus: Milestone['status'] =
          m.status === 'pending' ? 'in_progress' :
          m.status === 'in_progress' ? 'completed' :
          m.status === 'completed' ? 'pending' : 'pending';
        return { ...m, status: nextStatus, completedAt: nextStatus === 'completed' ? Date.now() : undefined };
      }),
    })));
  };

  // Overall progress
  const totalMilestones = chapters.reduce((sum, ch) => sum + ch.milestones.length, 0);
  const completedMilestones = chapters.reduce((sum, ch) => sum + ch.milestones.filter(m => m.status === 'completed').length, 0);
  const overallProgress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;
  const currentChapter = chapters.find(ch => ch.status === 'active');

  return (
    <div className="flex flex-col h-full bg-[#02050A] text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
            <BookOpen size={16} className="text-pink-500" />
          </div>
          <div>
            <div className="text-sm font-semibold">Narrative Engine</div>
            <div className="text-[10px] text-white/30 font-mono">STORY-DRIVEN PROJECT TIMELINE</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress */}
          <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-white/30">
            <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-1000" style={{ width: `${overallProgress}%` }} />
            </div>
            <span>{Math.round(overallProgress)}%</span>
          </div>

          {/* View toggle */}
          <div className="flex items-center bg-white/5 rounded-lg p-0.5">
            <button
              onClick={() => setView('timeline')}
              className={`px-2 py-1 rounded text-[9px] font-mono transition-all cursor-pointer ${view === 'timeline' ? 'bg-white/10 text-white' : 'text-white/30'}`}
            >
              Timeline
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`px-2 py-1 rounded text-[9px] font-mono transition-all cursor-pointer ${view === 'kanban' ? 'bg-white/10 text-white' : 'text-white/30'}`}
            >
              Kanban
            </button>
          </div>
        </div>
      </div>

      {/* Current Chapter Hero */}
      {currentChapter && (
        <div className="px-6 py-5 border-b border-white/5 bg-gradient-to-r from-amber-500/5 to-transparent shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="px-2 py-0.5 rounded-full bg-amber-500/10 text-[9px] font-mono text-amber-500 uppercase tracking-wider">
              Current Chapter
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <currentChapter.icon size={22} className="text-amber-500" />
            </div>
            <div>
              <div className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                Chapter {currentChapter.number}: {currentChapter.title}
              </div>
              <div className="text-sm text-white/40">{currentChapter.subtitle}</div>
              <div className="flex items-center gap-4 mt-2 text-[10px] font-mono text-white/25">
                <span>{currentChapter.milestones.filter(m => m.status === 'completed').length}/{currentChapter.milestones.length} milestones</span>
                <span>{currentChapter.milestones.filter(m => m.status === 'in_progress').length} in progress</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chapters Timeline */}
      <div className="flex-1 overflow-y-auto p-6">
        {view === 'timeline' ? (
          <div className="space-y-4 max-w-3xl mx-auto">
            {chapters.map(chapter => (
              <ChapterCard
                key={chapter.id}
                chapter={chapter}
                isExpanded={expandedChapters.has(chapter.id)}
                onToggle={() => toggleChapter(chapter.id)}
                onMilestoneToggle={toggleMilestone}
              />
            ))}
          </div>
        ) : (
          // Kanban view
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['pending', 'in_progress', 'completed'].map(status => {
              const statusLabel = { pending: 'To Do', in_progress: 'In Progress', completed: 'Done' }[status];
              const statusColor = { pending: '#94a3b8', in_progress: '#f59e0b', completed: '#22c55e' }[status];
              const milestones = chapters.flatMap(ch => ch.milestones).filter(m => m.status === status);

              return (
                <div key={status} className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: statusColor }} />
                    <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: statusColor }}>{statusLabel}</span>
                    <span className="text-[10px] text-white/20 font-mono ml-auto">{milestones.length}</span>
                  </div>
                  <div className="space-y-2">
                    {milestones.map(m => (
                      <div
                        key={m.id}
                        className="p-2.5 bg-white/[0.02] border border-white/5 rounded-lg hover:border-white/10 transition-all cursor-pointer"
                        onClick={() => toggleMilestone(m.id)}
                      >
                        <div className="text-xs font-medium text-white/70 mb-1">{m.title}</div>
                        <div className="text-[9px] text-white/25">{m.description}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <MilestoneBadge type={m.type} />
                          {m.assignee && <span className="text-[8px] text-white/15 font-mono">{m.assignee}</span>}
                        </div>
                      </div>
                    ))}
                    {milestones.length === 0 && (
                      <div className="text-center text-white/10 text-[10px] py-4">No items</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 bg-black/40 text-[9px] font-mono text-white/20">
        <div className="flex items-center gap-4">
          <span>{chapters.length} chapters</span>
          <span>{totalMilestones} milestones</span>
          <span>{completedMilestones} completed</span>
        </div>
        <div className="flex items-center gap-1">
          <Flag size={9} className="text-amber-500/50" />
          <span>Luxor9 Ai Factory — Project Story</span>
        </div>
      </div>
    </div>
  );
}
