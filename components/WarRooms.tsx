import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, MessageSquare, PenTool, Send, Eye, EyeOff, Mic, MicOff,
  Video, VideoOff, ScreenShare, Hand, Pin, Trash2, Plus, Settings,
  Crown, Shield, Circle, Check, X, ChevronDown, Lock, Globe,
  MousePointer, Type, Square, Circle as CircleIcon, ArrowRight,
  Highlighter, Eraser, Undo, Redo, Layers, Maximize2, Minimize2
} from 'lucide-react';

// --- Types ---
interface WarRoom {
  id: string;
  name: string;
  description: string;
  host: string;
  participants: Participant[];
  isActive: boolean;
  isPrivate: boolean;
  createdAt: number;
  maxParticipants: number;
}

interface Participant {
  id: string;
  name: string;
  avatar: string;
  color: string;
  role: 'host' | 'collaborator' | 'viewer';
  isOnline: boolean;
  cursor?: { x: number; y: number };
  isSpeaking: boolean;
  isMuted: boolean;
  joinedAt: number;
}

interface ChatMessage {
  id: string;
  author: string;
  content: string;
  timestamp: number;
  type: 'message' | 'system' | 'annotation';
}

interface Annotation {
  id: string;
  author: string;
  type: 'pen' | 'text' | 'arrow' | 'rect' | 'highlight';
  x: number;
  y: number;
  color: string;
  content?: string;
}

// --- Mock Data ---
const MOCK_ROOMS: WarRoom[] = [
  {
    id: 'wr-1', name: 'Product Strategy Session', description: 'Review Q2 roadmap and prioritize features',
    host: 'You', isActive: true, isPrivate: true, createdAt: Date.now() - 3600000, maxParticipants: 8,
    participants: [
      { id: 'p1', name: 'You', avatar: 'YO', color: '#f59e0b', role: 'host', isOnline: true, isSpeaking: false, isMuted: false, joinedAt: Date.now() - 3600000 },
      { id: 'p2', name: 'Alex Chen', avatar: 'AC', color: '#3b82f6', role: 'collaborator', isOnline: true, isSpeaking: true, isMuted: false, joinedAt: Date.now() - 1800000 },
      { id: 'p3', name: 'Sarah Kim', avatar: 'SK', color: '#a855f7', role: 'collaborator', isOnline: true, isSpeaking: false, isMuted: true, joinedAt: Date.now() - 900000 },
      { id: 'p4', name: 'Mike Ross', avatar: 'MR', color: '#22c55e', role: 'viewer', isOnline: false, isSpeaking: false, isMuted: true, joinedAt: Date.now() - 600000 },
    ],
  },
  {
    id: 'wr-2', name: 'Architecture Review', description: 'Deep dive into system design decisions',
    host: 'Alex Chen', isActive: true, isPrivate: false, createdAt: Date.now() - 7200000, maxParticipants: 12,
    participants: [
      { id: 'p5', name: 'Alex Chen', avatar: 'AC', color: '#3b82f6', role: 'host', isOnline: true, isSpeaking: false, isMuted: false, joinedAt: Date.now() - 7200000 },
      { id: 'p6', name: 'Jordan Lee', avatar: 'JL', color: '#ec4899', role: 'collaborator', isOnline: true, isSpeaking: false, isMuted: false, joinedAt: Date.now() - 3600000 },
    ],
  },
  {
    id: 'wr-3', name: 'Design Sprint', description: 'Rapid prototyping for new feature concepts',
    host: 'Sarah Kim', isActive: false, isPrivate: true, createdAt: Date.now() - 86400000, maxParticipants: 6,
    participants: [
      { id: 'p7', name: 'Sarah Kim', avatar: 'SK', color: '#a855f7', role: 'host', isOnline: false, isSpeaking: false, isMuted: false, joinedAt: Date.now() - 86400000 },
    ],
  },
];

const MOCK_MESSAGES: ChatMessage[] = [
  { id: 'm1', author: 'System', content: 'War Room session started', timestamp: Date.now() - 3600000, type: 'system' },
  { id: 'm2', author: 'You', content: 'Let\'s start by reviewing the current sprint goals.', timestamp: Date.now() - 3500000, type: 'message' },
  { id: 'm3', author: 'Alex Chen', content: 'I\'ve prepared the analytics dashboard. Sharing screen now.', timestamp: Date.now() - 3400000, type: 'message' },
  { id: 'm4', author: 'Sarah Kim', content: 'The user engagement metrics look promising. Should we double down on the chatboard feature?', timestamp: Date.now() - 3200000, type: 'message' },
  { id: 'm5', author: 'System', content: 'Alex Chen started screen sharing', timestamp: Date.now() - 3100000, type: 'system' },
  { id: 'm6', author: 'You', content: 'Agreed. Let\'s prioritize ChatBoard and Factory Floor. The visual elements drive engagement.', timestamp: Date.now() - 3000000, type: 'message' },
];

// --- Room Card ---
function RoomCard({ room, onJoin, onEnter }: { room: WarRoom; onJoin: () => void; onEnter: () => void }) {
  const onlineCount = room.participants.filter(p => p.isOnline).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-white/[0.02] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">{room.name}</h3>
            {room.isPrivate ? (
              <Lock size={12} className="text-white/20" />
            ) : (
              <Globe size={12} className="text-white/20" />
            )}
            {room.isActive && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-[8px] font-mono text-emerald-500">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE
              </span>
            )}
          </div>
          <p className="text-[11px] text-white/30 mt-0.5">{room.description}</p>
        </div>
      </div>

      {/* Participants */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex -space-x-2">
          {room.participants.slice(0, 5).map(p => (
            <div
              key={p.id}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold border-2 border-[#02050A]"
              style={{ background: `${p.color}20`, color: p.color }}
            >
              {p.avatar}
            </div>
          ))}
          {room.participants.length > 5 && (
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold bg-white/5 border-2 border-[#02050A] text-white/40">
              +{room.participants.length - 5}
            </div>
          )}
        </div>
        <span className="text-[10px] text-white/30 font-mono">
          {onlineCount}/{room.participants.length} online
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-white/20 font-mono">
          Hosted by {room.host}
        </span>
        <button
          onClick={room.isActive ? onEnter : onJoin}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
            room.isActive
              ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
              : 'bg-white/5 text-white/40 hover:bg-white/10'
          }`}
        >
          {room.isActive ? 'Enter Room' : 'Join'}
        </button>
      </div>
    </motion.div>
  );
}

// --- Active Room View ---
function ActiveRoomView({ room, onLeave }: { room: WarRoom; onLeave: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES);
  const [input, setInput] = useState('');
  const [activeTool, setActiveTool] = useState<'select' | 'pen' | 'text' | 'arrow' | 'rect' | 'highlight' | 'eraser'>('select');
  const [showParticipants, setShowParticipants] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, {
      id: `m-${Date.now()}`,
      author: 'You',
      content: input.trim(),
      timestamp: Date.now(),
      type: 'message',
    }]);
    setInput('');
  };

  const onlineParticipants = room.participants.filter(p => p.isOnline);

  return (
    <div className="flex flex-col h-full bg-[#02050A] text-white overflow-hidden">
      {/* Room Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-[9px] font-mono text-emerald-500">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
            </span>
            <h2 className="text-sm font-semibold">{room.name}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Participant avatars */}
          <div className="flex -space-x-1.5 mr-2">
            {onlineParticipants.slice(0, 4).map(p => (
              <div
                key={p.id}
                className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold border border-[#02050A]"
                style={{ background: `${p.color}20`, color: p.color }}
                title={p.name}
              >
                {p.avatar}
              </div>
            ))}
            {onlineParticipants.length > 4 && (
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] bg-white/5 text-white/40 border border-[#02050A]">
                +{onlineParticipants.length - 4}
              </div>
            )}
          </div>

          <button onClick={() => setShowParticipants(!showParticipants)} className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 transition-all cursor-pointer">
            <Users size={14} />
          </button>
          <button onClick={onLeave} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all cursor-pointer">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Canvas Area */}
        <div className="flex-1 relative bg-[#050505] overflow-hidden">
          {/* Annotation Toolbar */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/80 backdrop-blur border border-white/10 rounded-xl p-1 z-20">
            {[
              { tool: 'select' as const, icon: MousePointer, label: 'Select' },
              { tool: 'pen' as const, icon: PenTool, label: 'Draw' },
              { tool: 'text' as const, icon: Type, label: 'Text' },
              { tool: 'arrow' as const, icon: ArrowRight, label: 'Arrow' },
              { tool: 'rect' as const, icon: Square, label: 'Rect' },
              { tool: 'highlight' as const, icon: Highlighter, label: 'Highlight' },
              { tool: 'eraser' as const, icon: Eraser, label: 'Eraser' },
            ].map(({ tool, icon: Icon, label }) => (
              <button
                key={tool}
                onClick={() => setActiveTool(tool)}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  activeTool === tool ? 'bg-amber-500/20 text-amber-500' : 'text-white/30 hover:text-white/60 hover:bg-white/5'
                }`}
                title={label}
              >
                <Icon size={14} />
              </button>
            ))}
            <div className="w-px h-5 bg-white/10 mx-1" />
            <button className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all cursor-pointer"><Undo size={14} /></button>
            <button className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all cursor-pointer"><Redo size={14} /></button>
          </div>

          {/* Shared Canvas */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[90%] h-[80%] bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-center">
              <div className="text-center text-white/15">
                <ScreenShare size={32} className="mx-auto mb-3 opacity-30" />
                <div className="text-sm">Shared Canvas</div>
                <div className="text-[10px] mt-1">Draw, annotate, and collaborate in real-time</div>
              </div>
            </div>
          </div>

          {/* Remote cursors */}
          {onlineParticipants.filter(p => p.id !== 'p1' && p.cursor).map(p => (
            <div
              key={p.id}
              className="absolute z-30 pointer-events-none transition-all duration-100"
              style={{ left: p.cursor?.x || 50, top: p.cursor?.y || 50 }}
            >
              <MousePointer size={14} style={{ color: p.color }} />
              <span className="text-[8px] font-mono ml-1 px-1 rounded" style={{ background: `${p.color}20`, color: p.color }}>
                {p.name.split(' ')[0]}
              </span>
            </div>
          ))}

          {/* Speaking indicator */}
          {onlineParticipants.some(p => p.isSpeaking) && (
            <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 z-20">
              <Mic size={12} className="text-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-500 font-mono">
                {onlineParticipants.find(p => p.isSpeaking)?.name} is speaking
              </span>
            </div>
          )}
        </div>

        {/* Right Panel — Chat + Participants */}
        <div className="w-72 border-l border-white/5 bg-black/30 flex flex-col shrink-0">
          {/* Tabs */}
          <div className="flex border-b border-white/5">
            <button className="flex-1 py-2 text-[10px] font-mono text-amber-500 border-b border-amber-500 uppercase tracking-wider">Chat</button>
            <button className="flex-1 py-2 text-[10px] font-mono text-white/30 hover:text-white/50 uppercase tracking-wider">Notes</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map(msg => (
              <div key={msg.id} className={msg.type === 'system' ? 'text-center' : ''}>
                {msg.type === 'system' ? (
                  <div className="text-[9px] text-white/20 font-mono py-1">{msg.content}</div>
                ) : (
                  <div className="group">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold text-white/60">{msg.author}</span>
                      <span className="text-[8px] text-white/15 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/50 leading-relaxed">{msg.content}</p>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/5">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                placeholder="Message..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/30"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                className="p-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 disabled:opacity-30 rounded-lg transition-all cursor-pointer"
              >
                <Send size={14} />
              </button>
            </div>
          </div>

          {/* Participants Panel */}
          {showParticipants && (
            <div className="border-t border-white/5 p-3 max-h-40 overflow-y-auto">
              <div className="text-[9px] text-white/20 font-mono uppercase tracking-wider mb-2">Participants</div>
              <div className="space-y-1.5">
                {room.participants.map(p => (
                  <div key={p.id} className="flex items-center gap-2">
                    <div className="relative">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold"
                        style={{ background: `${p.color}20`, color: p.color }}
                      >
                        {p.avatar}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#02050A] ${
                        p.isOnline ? 'bg-emerald-500' : 'bg-white/20'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-white/60 truncate">{p.name}</div>
                      <div className="text-[8px] text-white/20 font-mono capitalize">{p.role}</div>
                    </div>
                    {p.isSpeaking && <Mic size={10} className="text-emerald-500 animate-pulse" />}
                    {p.isMuted && <MicOff size={10} className="text-white/15" />}
                    {p.role === 'host' && <Crown size={10} className="text-amber-500" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Main War Rooms ---
export default function WarRooms() {
  const [rooms, setRooms] = useState<WarRoom[]>(MOCK_ROOMS);
  const [activeRoom, setActiveRoom] = useState<WarRoom | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomPrivate, setNewRoomPrivate] = useState(true);

  const createRoom = () => {
    if (!newRoomName.trim()) return;
    const newRoom: WarRoom = {
      id: `wr-${Date.now()}`,
      name: newRoomName.trim(),
      description: 'New collaborative session',
      host: 'You',
      isActive: true,
      isPrivate: newRoomPrivate,
      createdAt: Date.now(),
      maxParticipants: 8,
      participants: [
        { id: 'p-self', name: 'You', avatar: 'YO', color: '#f59e0b', role: 'host', isOnline: true, isSpeaking: false, isMuted: false, joinedAt: Date.now() },
      ],
    };
    setRooms(prev => [newRoom, ...prev]);
    setActiveRoom(newRoom);
    setShowCreate(false);
    setNewRoomName('');
  };

  if (activeRoom) {
    return <ActiveRoomView room={activeRoom} onLeave={() => setActiveRoom(null)} />;
  }

  return (
    <div className="flex flex-col h-full bg-[#02050A] text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <Users size={16} className="text-rose-500" />
          </div>
          <div>
            <div className="text-sm font-semibold">War Rooms</div>
            <div className="text-[10px] text-white/30 font-mono">COLLABORATIVE SESSIONS</div>
          </div>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-500 text-[10px] font-mono hover:bg-amber-500/20 transition-all cursor-pointer"
        >
          <Plus size={12} /> New Room
        </button>
      </div>

      {/* Create Room Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-2xl p-6"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4">Create War Room</h3>
              <input
                type="text"
                value={newRoomName}
                onChange={e => setNewRoomName(e.target.value)}
                placeholder="Room name..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/30 mb-3"
                autoFocus
              />
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => setNewRoomPrivate(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                    newRoomPrivate ? 'bg-white/10 text-white' : 'bg-white/5 text-white/30'
                  }`}
                >
                  <Lock size={14} /> Private
                </button>
                <button
                  onClick={() => setNewRoomPrivate(false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                    !newRoomPrivate ? 'bg-white/10 text-white' : 'bg-white/5 text-white/30'
                  }`}
                >
                  <Globe size={14} /> Public
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 text-white/40 text-sm font-medium cursor-pointer">
                  Cancel
                </button>
                <button
                  onClick={createRoom}
                  disabled={!newRoomName.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 text-black text-sm font-semibold disabled:opacity-30 cursor-pointer"
                >
                  Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Room List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Active rooms */}
        {rooms.filter(r => r.isActive).length > 0 && (
          <div>
            <div className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-2">Active Sessions</div>
            <div className="grid gap-3 md:grid-cols-2">
              {rooms.filter(r => r.isActive).map(room => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onJoin={() => {}}
                  onEnter={() => setActiveRoom(room)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Ended rooms */}
        {rooms.filter(r => !r.isActive).length > 0 && (
          <div>
            <div className="text-[10px] font-mono text-white/20 uppercase tracking-wider mb-2 mt-4">Past Sessions</div>
            <div className="grid gap-3 md:grid-cols-2 opacity-50">
              {rooms.filter(r => !r.isActive).map(room => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onJoin={() => {}}
                  onEnter={() => {}}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 bg-black/40 text-[9px] font-mono text-white/20">
        <span>{rooms.filter(r => r.isActive).length} active rooms</span>
        <span>War Rooms — Real-time Collaboration</span>
      </div>
    </div>
  );
}
