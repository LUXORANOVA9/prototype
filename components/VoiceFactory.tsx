import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Volume2, VolumeX, Radio, Waves, Activity, Zap,
  Brain, MessageSquare, Play, Pause, RotateCcw, Settings, Send,
  Headphones, Speaker, AudioLines, CircleDot, Square
} from 'lucide-react';

// --- Types ---
interface VoiceMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  duration?: number; // seconds
  isPlaying?: boolean;
}

interface VoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  volume: number;
  transcript: string;
}

// --- Mock transcript samples ---
const MOCK_TRANSCRIPTS = [
  "What's the status of all agents?",
  "Have the Developer agent review the latest pull request",
  "Summarize today's accomplishments in the Factory Floor",
  "Create a new workflow for customer onboarding",
  "Search my memories about the deployment setup",
  "What did I dream about last night?",
];

const MOCK_RESPONSES = [
  "All 12 agents are online. Overseer is coordinating, Developer is reviewing code, Visionary is generating assets, and the rest are standing by. Factory Floor is at 67% capacity.",
  "I've delegated the PR review to the Developer agent. It's analyzing the changes for potential issues, checking test coverage, and will provide a detailed report within 2 minutes.",
  "Today the factory completed 23 tasks across 4 sessions. Key achievements: ChatBoard deployed, Factory Floor visualization live, Agent Playground built with drag-and-drop workflows.",
  "I've created a new 5-step workflow: Trigger → Researcher (customer data) → Developer (setup config) → Communicator (welcome email) → Output (CRM update). Ready to deploy.",
  "Found 3 memories about deployment: Coolify setup, Docker Compose config, and nginx reverse proxy. All configured for self-hosted PaaS with auto SSL.",
  "You dreamed about a city made of code. Buildings were functions, elevators were API calls, and people were data flowing through the streets. It was raining semicolons.",
];

// --- Waveform Visualization ---
function Waveform({ isActive, volume }: { isActive: boolean; volume: number }) {
  const bars = 32;
  return (
    <div className="flex items-center justify-center gap-[2px] h-16">
      {Array.from({ length: bars }).map((_, i) => {
        const baseHeight = isActive ? 8 + Math.random() * 40 * (volume / 100) : 4;
        const delay = i * 0.03;
        return (
          <motion.div
            key={i}
            className="w-[3px] rounded-full"
            style={{
              background: isActive
                ? `linear-gradient(to top, #f59e0b, #fbbf24)`
                : 'rgba(255,255,255,0.1)',
            }}
            animate={{
              height: isActive ? [4, baseHeight, 4] : 4,
              opacity: isActive ? [0.5, 1, 0.5] : 0.3,
            }}
            transition={{
              duration: isActive ? 0.4 + Math.random() * 0.3 : 0.3,
              repeat: isActive ? Infinity : 0,
              delay,
              ease: 'easeInOut',
            }}
          />
        );
      })}
    </div>
  );
}

// --- Message Bubble ---
function VoiceMessageBubble({ message, onPlay }: { message: VoiceMessage; onPlay: () => void }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
    >
      <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        {!isUser && (
          <div className="flex items-center gap-2 mb-1 ml-1">
            <div className="w-5 h-5 rounded-md bg-amber-500/20 flex items-center justify-center">
              <Brain size={10} className="text-amber-500" />
            </div>
            <span className="text-[9px] text-white/30 font-mono uppercase">Luxor9</span>
          </div>
        )}
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-amber-500/10 border border-amber-500/20 text-white/80'
            : 'bg-white/5 border border-white/8 text-white/70'
        }`}>
          <p>{message.content}</p>
          {message.duration && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
              <button onClick={onPlay} className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/50 cursor-pointer">
                <Play size={10} /> {message.duration}s
              </button>
            </div>
          )}
        </div>
        <div className={`text-[9px] text-white/15 mt-1 ${isUser ? 'text-right mr-1' : 'ml-1'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </motion.div>
  );
}

// --- Main Voice Interface ---
export default function VoiceFactory() {
  const [messages, setMessages] = useState<VoiceMessage[]>([
    { id: 'v1', role: 'assistant', content: 'Voice link established. I am the Overseer. Speak your command, and I will coordinate the factory.', timestamp: Date.now() - 60000, duration: 4 },
  ]);
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    isSpeaking: false,
    isProcessing: false,
    volume: 0,
    transcript: '',
  });
  const [isMuted, setIsMuted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const transcriptTimerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulate voice input
  const startListening = () => {
    setVoiceState(prev => ({ ...prev, isListening: true, volume: 0, transcript: '' }));

    // Simulate volume fluctuation
    const volumeInterval = setInterval(() => {
      setVoiceState(prev => ({ ...prev, volume: 20 + Math.random() * 80 }));
    }, 100);

    // Simulate transcript appearing
    const transcript = MOCK_TRANSCRIPTS[Math.floor(Math.random() * MOCK_TRANSCRIPTS.length)];
    let charIndex = 0;
    transcriptTimerRef.current = setInterval(() => {
      if (charIndex <= transcript.length) {
        setVoiceState(prev => ({ ...prev, transcript: transcript.slice(0, charIndex) }));
        charIndex += 2;
      }
    }, 50);

    // Auto-stop after 3 seconds
    setTimeout(() => {
      clearInterval(volumeInterval);
      if (transcriptTimerRef.current) clearInterval(transcriptTimerRef.current);
      setVoiceState(prev => ({ ...prev, isListening: false, volume: 0, isProcessing: true, transcript }));

      // Add user message
      const userMsg: VoiceMessage = {
        id: `v-${Date.now()}`,
        role: 'user',
        content: transcript,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, userMsg]);

      // Simulate AI response after delay
      setTimeout(() => {
        const response = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
        const aiMsg: VoiceMessage = {
          id: `v-${Date.now() + 1}`,
          role: 'assistant',
          content: response,
          timestamp: Date.now(),
          duration: 3 + Math.floor(Math.random() * 5),
        };
        setMessages(prev => [...prev, aiMsg]);
        setVoiceState(prev => ({ ...prev, isProcessing: false, isSpeaking: true }));

        // Stop speaking animation
        setTimeout(() => {
          setVoiceState(prev => ({ ...prev, isSpeaking: false }));
        }, 2000);
      }, 1500);
    }, 3000);
  };

  const stopListening = () => {
    if (transcriptTimerRef.current) clearInterval(transcriptTimerRef.current);
    setVoiceState(prev => ({ ...prev, isListening: false, volume: 0 }));
  };

  return (
    <div className="flex flex-col h-full bg-[#02050A] text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <Headphones size={16} className="text-orange-500" />
          </div>
          <div>
            <div className="text-sm font-semibold">Voice Factory</div>
            <div className="text-[10px] text-white/30 font-mono">VOICE-FIRST AI INTERFACE</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-mono ${
            voiceState.isListening ? 'bg-emerald-500/10 text-emerald-500' :
            voiceState.isProcessing ? 'bg-amber-500/10 text-amber-500' :
            voiceState.isSpeaking ? 'bg-blue-500/10 text-blue-500' :
            'bg-white/5 text-white/30'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              voiceState.isListening ? 'bg-emerald-500 animate-pulse' :
              voiceState.isProcessing ? 'bg-amber-500 animate-pulse' :
              voiceState.isSpeaking ? 'bg-blue-500 animate-pulse' :
              'bg-white/20'
            }`} />
            {voiceState.isListening ? 'Listening' :
             voiceState.isProcessing ? 'Processing' :
             voiceState.isSpeaking ? 'Speaking' :
             'Ready'}
          </div>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 transition-all cursor-pointer"
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Waveform Visualization */}
        <div className="flex items-center justify-center py-6 border-b border-white/5 bg-black/20 shrink-0">
          <Waveform isActive={voiceState.isListening || voiceState.isSpeaking} volume={voiceState.volume} />
        </div>

        {/* Live Transcript */}
        {(voiceState.isListening || voiceState.isProcessing) && voiceState.transcript && (
          <div className="px-4 py-3 bg-amber-500/5 border-b border-amber-500/10 shrink-0">
            <div className="text-[9px] text-amber-500/50 font-mono uppercase tracking-wider mb-1">
              {voiceState.isListening ? 'Transcribing...' : 'Processing...'}
            </div>
            <p className="text-sm text-white/60 italic">{voiceState.transcript}</p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map(msg => (
            <VoiceMessageBubble key={msg.id} message={msg} onPlay={() => {}} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Voice Control */}
        <div className="p-4 border-t border-white/5 bg-black/30 shrink-0">
          <div className="flex items-center justify-center gap-4">
            {/* Main mic button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={voiceState.isListening ? stopListening : startListening}
              disabled={voiceState.isProcessing}
              className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                voiceState.isListening
                  ? 'bg-emerald-500/20 border-2 border-emerald-500 shadow-[0_0_40px_rgba(34,197,94,0.3)]'
                  : voiceState.isProcessing
                  ? 'bg-amber-500/20 border-2 border-amber-500'
                  : 'bg-white/5 border-2 border-white/10 hover:border-amber-500/50'
              }`}
            >
              {/* Pulse ring when listening */}
              {voiceState.isListening && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-emerald-500/30"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}

              {voiceState.isListening ? (
                <Square size={24} className="text-emerald-500" />
              ) : voiceState.isProcessing ? (
                <Activity size={24} className="text-amber-500 animate-pulse" />
              ) : (
                <Mic size={24} className="text-white/60" />
              )}
            </motion.button>
          </div>

          <div className="text-center mt-3">
            <span className="text-[9px] text-white/20 font-mono">
              {voiceState.isListening ? 'Tap to stop' :
               voiceState.isProcessing ? 'Processing your command...' :
               'Tap to speak'}
            </span>
          </div>

          {/* Quick commands */}
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            {['Status check', 'Delegate task', 'Search memories', 'Create workflow'].map(cmd => (
              <button
                key={cmd}
                onClick={startListening}
                className="px-3 py-1 rounded-full bg-white/5 text-[9px] text-white/30 font-mono hover:bg-white/10 hover:text-white/50 transition-all cursor-pointer"
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
