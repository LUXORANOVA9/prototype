import React, { useEffect, useState } from 'react';
import { AgentStatus, AgentType } from '../types';
import { Eye, Brain, Video, Mic, MapPin, Zap, Server, Settings, AlertCircle, Globe, Users, Wrench, BarChart3, Terminal, Layers, Command, Cpu, Network, Sun, Moon, Circle, ChevronDown, ShieldCheck, Database, Code2, Sparkles } from 'lucide-react';
import { mcpRouter } from '../services/mcpRouter';
import { AVAILABLE_SKILLS } from '../services/skillsService';
import agentGroupsData from '../public/agents.json';

interface Props {
  activeAgent: AgentType;
  onSelect: (agent: AgentType) => void;
  onOpenMcp: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
    Eye, Brain, Video, Mic, MapPin, Zap, Server, Settings, AlertCircle, Globe, Users, Wrench, BarChart3, Terminal, Layers, Command, Cpu, Network, Sun, Moon
};

interface AgentConfig {
    id: AgentType;
    name: string;
    description: string;
    icon: string;
    subGroups?: AgentGroupConfig[];
}

interface AgentGroupConfig {
    label: string;
    color?: string;
    agents: AgentConfig[];
}

const ParticleSystem: React.FC<{ isHovered: boolean }> = ({ isHovered }) => {
  // Generate a fixed number of particles
  const particles = Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    size: Math.random() * 3 + 1,
    left: Math.random() * 100,
    top: Math.random() * 100,
    animationDuration: Math.random() * 3 + 2,
    animationDelay: Math.random() * 2,
  }));

  return (
    <div 
      className={`absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-700 z-0 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
    >
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full bg-amber-500/40 dark:bg-amber-400/30"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            left: `${p.left}%`,
            top: `${p.top}%`,
            animation: isHovered ? `float ${p.animationDuration}s ease-in-out ${p.animationDelay}s infinite alternate` : 'none',
          }}
        />
      ))}
    </div>
  );
};

const AgentItem: React.FC<{
    agent: AgentConfig;
    activeAgent: AgentType;
    onSelect: (agent: AgentType) => void;
    level: number;
}> = ({ agent, activeAgent, onSelect, level }) => {
    const Icon = ICON_MAP[agent.icon] || Circle;
    const isActive = activeAgent === agent.id;
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="flex flex-col">
            <button
                onClick={() => onSelect(agent.id)}
                className={`
                    relative flex items-center gap-3 p-2 rounded-lg transition-all duration-200 group/btn
                    border border-transparent
                    ${isActive 
                        ? 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-zinc-100 shadow-sm' 
                        : 'hover:bg-white/60 dark:hover:bg-white/5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }
                `}
                style={{ marginLeft: `${level * 16}px` }}
            >
                {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber-500 rounded-full"></div>
                )}
                
                <div className={`p-1.5 rounded transition-colors relative z-10 ${isActive ? 'text-amber-600 dark:text-amber-500' : 'text-current opacity-70 group-hover/btn:opacity-100'}`}>
                    <Icon size={16} />
                </div>
                
                <div className="flex flex-col items-start relative z-10 flex-1">
                    <span className={`text-xs font-bold tracking-wide transition-colors ${isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400'}`}>{agent.name}</span>
                </div>

                {agent.subGroups && agent.subGroups.length > 0 && (
                    <div 
                        onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                        className="p-1 hover:bg-zinc-200 dark:hover:bg-white/10 rounded transition-colors ml-auto"
                    >
                        <ChevronDown size={14} className={`transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`} />
                    </div>
                )}
            </button>

            {agent.subGroups && isExpanded && (
                <div className="flex flex-col mt-1 gap-1 relative">
                    {/* Hierarchy Line */}
                    <div 
                        className="absolute top-0 bottom-2 w-px bg-zinc-200 dark:bg-white/10"
                        style={{ left: `${(level * 16) + 20}px` }}
                    ></div>

                    {agent.subGroups.map((group, gIdx) => (
                        <div key={gIdx} className="flex flex-col gap-0.5 mt-1">
                            {group.label && (
                                <div 
                                    className="py-1 text-[9px] font-bold text-zinc-400 dark:text-zinc-500 tracking-[0.15em] font-mono flex items-center gap-2 uppercase"
                                    style={{ paddingLeft: `${((level + 1) * 16) + 8}px` }}
                                >
                                    {group.label}
                                </div>
                            )}
                            <div className="flex flex-col gap-0.5">
                                {group.agents.map(subAgent => (
                                    <AgentItem 
                                        key={subAgent.id} 
                                        agent={subAgent} 
                                        activeAgent={activeAgent} 
                                        onSelect={onSelect} 
                                        level={level + 1}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const AgentSelector: React.FC<Props> = ({ activeAgent, onSelect, onOpenMcp, isDarkMode, onToggleTheme }) => {
  const [backendHealth, setBackendHealth] = useState<'ok' | 'checking' | 'down'>('checking');
  const [isHovered, setIsHovered] = useState(false);
  const [agentGroups, setAgentGroups] = useState<AgentGroupConfig[]>(agentGroupsData as AgentGroupConfig[]);
  
  useEffect(() => {
      const checkHealth = async () => {
          try {
              const res = await fetch(`/api/health`).catch(() => null);
              if (res && res.ok) {
                  setBackendHealth('ok');
              } else {
                  setBackendHealth('down');
              }
          } catch {
              setBackendHealth('down');
          }
      };
      checkHealth();
      const interval = setInterval(checkHealth, 30000);
      return () => clearInterval(interval);
  }, []);

  const isKeyConfigured = mcpRouter.isProviderConfigured('google');
  const isOnline = isKeyConfigured;

  return (
    <div 
      className="w-full h-auto min-h-16 pb-[env(safe-area-inset-bottom)] md:pb-0 md:h-full md:w-[280px] bg-zinc-50/80 dark:bg-[#050505] md:border-r border-t md:border-t-0 border-zinc-200 dark:border-white/5 flex md:flex-col flex-row shrink-0 overflow-hidden relative z-40 select-none shadow-sm dark:shadow-none transition-colors duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <ParticleSystem isHovered={isHovered} />
      
      {/* Brand Header */}
      <div className="hidden md:flex p-6 pb-2 items-center gap-4 mb-2 relative group cursor-pointer" onClick={onOpenMcp}>
        <div className="relative">
            <div className="w-10 h-10 rounded-sm bg-zinc-200 dark:bg-zinc-900 border border-zinc-300 dark:border-white/10 flex items-center justify-center font-bold text-zinc-900 dark:text-zinc-100 brand-font text-lg z-10 relative group-hover:border-amber-500/50 group-hover:text-amber-500 transition-colors">
                L9
            </div>
            {/* Holographic scanning line */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/20 to-transparent w-full h-full animate-[scan_3s_linear_infinite] opacity-0 group-hover:opacity-100 pointer-events-none"></div>
        </div>
        <div className="flex flex-col">
            <span className="font-bold text-lg text-zinc-800 dark:text-zinc-100 tracking-[0.1em] brand-font">LUXOR9</span>
            <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]' : 'bg-red-500 animate-pulse'}`}></div>
                <span className="text-[9px] text-zinc-500 font-mono tracking-[0.1em] uppercase">System {isOnline ? 'Ready' : 'Offline'}</span>
            </div>
        </div>
      </div>

      {/* Nav Items Container */}
      <div className="flex-1 flex md:flex-col flex-row overflow-hidden md:hover:overflow-y-auto custom-scrollbar md:px-3 md:pb-4 space-y-0 md:space-y-6">
          
          {/* Mobile Horizontal Scroll with Snap */}
          <div className="flex-1 flex md:hidden flex-row overflow-x-auto no-scrollbar items-center px-4 gap-3 snap-x snap-mandatory py-2">
              {agentGroups.flatMap(g => {
                  const allAgents: AgentConfig[] = [];
                  const collect = (agents: AgentConfig[]) => {
                      agents.forEach(a => {
                          allAgents.push(a);
                          if (a.subGroups) {
                              a.subGroups.forEach(sg => collect(sg.agents));
                          }
                      });
                  };
                  collect(g.agents);
                  return allAgents;
              }).map(agent => {
                   const Icon = ICON_MAP[agent.icon] || Circle;
                   const isActive = activeAgent === agent.id;
                   return (
                       <button 
                           key={agent.id} 
                           onClick={() => onSelect(agent.id)}
                           className={`
                             snap-center relative flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300
                             ${isActive 
                               ? 'bg-zinc-900 dark:bg-zinc-800 text-white dark:text-zinc-100 shadow-md scale-105 border border-amber-500/50' 
                               : 'bg-zinc-100 dark:bg-zinc-900/40 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-white/5'
                             }
                           `}
                       >
                           <Icon size={20} />
                           {isActive && <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-amber-500"></div>}
                       </button>
                   )
              })}
          </div>

          {/* Desktop Vertical Groups */}
          <div className="hidden md:flex flex-col gap-6">
            {/* System Load (New) */}
            <div className="px-3 flex flex-col gap-2 mb-2">
                <div className="flex justify-between items-center text-[8px] font-mono text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">
                    <span>Neural Load</span>
                    <span className="text-amber-500">{(Math.random() * 15 + 5).toFixed(1)}%</span>
                </div>
                <div className="h-0.5 w-full bg-zinc-200 dark:bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500/50 w-[12%] animate-pulse"></div>
                </div>
            </div>

            {/* Skill Matrix (New) */}
            <div className="px-3 flex flex-col gap-3 mb-4">
                <div className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 tracking-[0.2em] font-mono flex items-center gap-2 opacity-70 uppercase">
                    <Sparkles size={10} />
                    Active Skills
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {Object.keys(AVAILABLE_SKILLS).map(skillId => (
                        <div 
                            key={skillId} 
                            title={skillId}
                            className="aspect-square rounded bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/5 flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-amber-500 hover:border-amber-500/30 transition-all cursor-help group relative"
                        >
                            {skillId === 'composio' ? <Network size={12} /> : 
                             skillId === 'mcp' ? <Layers size={12} /> :
                             skillId === 'vision' ? <Eye size={12} /> :
                             <Zap size={12} />}
                            
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 text-white text-[8px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                                {skillId.replace('_', ' ')}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {agentGroups.map((group, idx) => (
                <div key={idx} className="flex flex-col gap-2 mb-4 bg-zinc-100/50 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/[0.05] rounded-xl p-2 mx-2">
                    <div className="px-2 py-1.5 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 tracking-[0.2em] font-mono flex items-center gap-2 uppercase border-b border-zinc-200/80 dark:border-white/10 mb-1">
                        <div className="w-1.5 h-1.5 rounded-sm bg-amber-500"></div>
                        {group.label}
                    </div>
                    
                    <div className="flex flex-col gap-1">
                        {group.agents.map(agent => (
                            <AgentItem 
                                key={agent.id} 
                                agent={agent} 
                                activeAgent={activeAgent} 
                                onSelect={onSelect} 
                                level={0}
                            />
                        ))}
                    </div>
                </div>
            ))}
          </div>

      </div>

      {/* Footer Info (Desktop) */}
      <div className="hidden md:flex p-4 border-t border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-black/40 flex-col gap-2">
        <div className="flex gap-2">
            <button 
                onClick={onOpenMcp}
                className={`flex-1 flex items-center gap-3 p-2 rounded-sm border transition-all group relative overflow-hidden ${
                    !isOnline 
                    ? 'bg-red-50 dark:bg-red-950/10 border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/20' 
                    : 'bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-500/30 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
            >
                <Settings size={14} className={`group-hover:rotate-90 transition-transform duration-500 z-10`} />
                <div className="flex flex-col items-start z-10">
                    <span className="text-[10px] font-bold uppercase tracking-wider">{!isOnline ? 'Config' : 'System'}</span>
                </div>
                {backendHealth === 'ok' && (
                     <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                )}
            </button>
            
            <button
                onClick={onToggleTheme}
                className="p-2 rounded-sm border border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 hover:text-amber-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                title="Toggle Theme"
            >
                {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
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
