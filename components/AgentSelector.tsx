import React from 'react';
import { AgentStatus, AgentType } from '../types';
import { Eye, Brain, Video, Mic, MapPin, Zap, Server, Settings, AlertCircle, Globe, Users, Wrench, BarChart3, Terminal, Layers, Command, Cpu, Network, Sun, Moon } from 'lucide-react';
import { mcpRouter } from '../services/mcpRouter';

interface Props {
  activeAgent: AgentType;
  onSelect: (agent: AgentType) => void;
  onOpenMcp: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const AGENT_GROUPS = [
    {
        label: 'EXECUTIVE',
        color: 'text-amber-500',
        agents: [
            { id: AgentType.OVERSEER, name: 'Overseer', description: 'Orchestration Core', icon: Brain },
        ]
    },
    {
        label: 'MANAGEMENT',
        color: 'text-blue-400',
        agents: [
            { id: AgentType.HR_MANAGER, name: 'HR Manager', description: 'Talent Acquisition', icon: Users },
            { id: AgentType.INTEGRATION_LEAD, name: 'Integration', description: 'Tooling & API', icon: Wrench },
        ]
    },
    {
        label: 'SPECIALIST',
        color: 'text-purple-400',
        agents: [
            { id: AgentType.RESEARCHER, name: 'Researcher', description: 'Web Intelligence', icon: Globe },
            { id: AgentType.DATA_ANALYST, name: 'Data Analyst', description: 'Pattern Recognition', icon: BarChart3 },
            { id: AgentType.VISIONARY, name: 'Visionary', description: 'Visual Cortex', icon: Eye },
            { id: AgentType.DIRECTOR, name: 'Director', description: 'Video Production', icon: Video },
            { id: AgentType.NAVIGATOR, name: 'Navigator', description: 'Geospatial Data', icon: MapPin },
        ]
    },
    {
        label: 'OPERATIONS',
        color: 'text-emerald-400',
        agents: [
            { id: AgentType.DEVELOPER, name: 'Developer', description: 'Code Execution', icon: Terminal },
            { id: AgentType.ANTIGRAVITY, name: 'Antigravity', description: 'Infrastructure', icon: Server },
            { id: AgentType.SPEEDSTER, name: 'Speedster', description: 'Low Latency Ops', icon: Zap },
            { id: AgentType.COMMUNICATOR, name: 'Communicator', description: 'Voice/Live Interface', icon: Mic },
        ]
    }
];

export const AgentSelector: React.FC<Props> = ({ activeAgent, onSelect, onOpenMcp, isDarkMode, onToggleTheme }) => {
  const isOnline = mcpRouter.isProviderConfigured('google');

  return (
    <div className="w-full h-16 md:h-full md:w-[280px] bg-white/80 dark:bg-[#09090b]/95 backdrop-blur-2xl md:border-r border-t md:border-t-0 border-zinc-200 dark:border-white/5 flex md:flex-col flex-row shrink-0 overflow-hidden relative z-40 select-none shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] md:shadow-none transition-colors duration-300">
      
      {/* Brand Header */}
      <div className="hidden md:flex p-6 pb-2 items-center gap-4 mb-2 relative group cursor-pointer" onClick={onOpenMcp}>
        <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800 shadow-lg flex items-center justify-center font-bold text-zinc-900 dark:text-zinc-100 brand-font text-lg z-10 relative border border-white/40 dark:border-white/10 group-hover:border-amber-500/50 transition-colors">
                L9
            </div>
            {/* Holographic scanning line */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/40 dark:via-white/10 to-transparent w-full h-full animate-[scan_3s_linear_infinite] opacity-0 group-hover:opacity-100 pointer-events-none rounded-xl"></div>
        </div>
        <div className="flex flex-col">
            <span className="font-bold text-lg text-zinc-800 dark:text-zinc-100 tracking-wider brand-font group-hover:text-amber-600 dark:group-hover:text-zinc-300 transition-colors">LUXOR9</span>
            <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]' : 'bg-red-500 animate-pulse'}`}></div>
                <span className="text-[9px] text-zinc-500 font-mono tracking-[0.1em] uppercase">System {isOnline ? 'Online' : 'Offline'}</span>
            </div>
        </div>
      </div>

      {/* Nav Items Container */}
      <div className="flex-1 flex md:flex-col flex-row overflow-hidden md:hover:overflow-y-auto custom-scrollbar md:px-3 md:pb-4 space-y-0 md:space-y-6">
          
          {/* Mobile Horizontal Scroll with Snap */}
          <div className="flex-1 flex md:hidden flex-row overflow-x-auto no-scrollbar items-center px-4 gap-3 snap-x snap-mandatory py-2">
              {AGENT_GROUPS.flatMap(g => g.agents).map(agent => {
                   const Icon = agent.icon;
                   const isActive = activeAgent === agent.id;
                   return (
                       <button 
                           key={agent.id} 
                           onClick={() => onSelect(agent.id)}
                           className={`
                             snap-center relative flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500
                             ${isActive 
                               ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-110' 
                               : 'bg-zinc-100 dark:bg-zinc-800/40 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-white/5'
                             }
                           `}
                       >
                           <Icon size={20} />
                           {isActive && <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-white dark:bg-zinc-900"></div>}
                       </button>
                   )
              })}
          </div>

          {/* Desktop Vertical Groups */}
          {AGENT_GROUPS.map((group, idx) => (
              <div key={idx} className="hidden md:flex flex-col gap-1">
                  <div className="px-3 py-1 text-[9px] font-bold text-zinc-500 dark:text-zinc-600 tracking-[0.2em] font-mono flex items-center gap-2 mb-1">
                      <div className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-800"></div>
                      {group.label}
                  </div>
                  
                  {group.agents.map(agent => {
                      const Icon = agent.icon;
                      const isActive = activeAgent === agent.id;
                      
                      return (
                          <button
                              key={agent.id}
                              onClick={() => onSelect(agent.id)}
                              className={`
                                  relative flex items-center gap-3 p-2.5 rounded-lg transition-all duration-300 group/btn
                                  border border-transparent overflow-hidden
                                  ${isActive 
                                      ? 'bg-zinc-100 dark:bg-zinc-800/80 border-zinc-200 dark:border-white/5 text-zinc-900 dark:text-zinc-100 shadow-sm dark:shadow-lg' 
                                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/40 text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                                  }
                              `}
                          >
                              {isActive && (
                                  <>
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-amber-500 rounded-r shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/50 dark:from-white/5 to-transparent pointer-events-none"></div>
                                  </>
                              )}
                              
                              <div className={`p-1.5 rounded-md transition-colors relative z-10 ${isActive ? 'bg-white dark:bg-zinc-950 text-amber-600 dark:text-amber-500 shadow-sm' : 'bg-zinc-200/50 dark:bg-zinc-900/50 group-hover/btn:bg-zinc-200 dark:group-hover/btn:bg-zinc-800'}`}>
                                  <Icon size={16} />
                              </div>
                              
                              <div className="flex flex-col items-start relative z-10">
                                  <span className={`text-xs font-bold tracking-wide transition-colors ${isActive ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400'}`}>{agent.name}</span>
                                  <span className={`text-[9px] font-mono truncate max-w-[140px] transition-colors ${isActive ? 'text-zinc-500' : 'opacity-40'}`}>{agent.description}</span>
                              </div>
                          </button>
                      );
                  })}
              </div>
          ))}

      </div>

      {/* Footer Info (Desktop) */}
      <div className="hidden md:flex p-4 border-t border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/20 flex-col gap-2">
        <div className="flex gap-2">
            <button 
                onClick={onOpenMcp}
                className={`flex-1 flex items-center gap-3 p-3 rounded-xl border transition-all group relative overflow-hidden ${
                    !isOnline 
                    ? 'bg-red-50 dark:bg-red-950/10 border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/20' 
                    : 'bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-500/30 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
            >
                <Settings size={16} className={`group-hover:rotate-90 transition-transform duration-500 z-10`} />
                <div className="flex flex-col items-start z-10">
                    <span className="text-[10px] font-bold uppercase tracking-wider">{!isOnline ? 'Config' : 'Settings'}</span>
                </div>
            </button>
            
            <button
                onClick={onToggleTheme}
                className="p-3 rounded-xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 hover:text-amber-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                title="Toggle Theme"
            >
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
        </div>
      </div>

      {/* Mobile Settings Button */}
      <div className="md:hidden flex items-center pr-4 pl-2 border-l border-zinc-200 dark:border-white/5 gap-2">
          <button 
            onClick={onToggleTheme}
            className="p-2 rounded-lg text-zinc-400 dark:text-zinc-400"
          >
             {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            onClick={onOpenMcp}
            className={`p-2 rounded-xl transition-all ${!isOnline ? 'text-red-500 animate-pulse' : 'text-zinc-400 hover:text-zinc-100'}`}
          >
            <Settings size={20} />
          </button>
      </div>

    </div>
  );
};