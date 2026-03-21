import React, { useState } from 'react';
import { Task, AgentType } from '../types';
import { 
  CircleCheck, 
  Circle, 
  ChevronDown, 
  Plus, 
  Lock, 
  Workflow,
  Check,
  PlayCircle,
  ListTodo,
  Trash2,
  Zap,
  Cpu,
  ArrowRight,
  GitBranch,
  Layers,
  CornerDownRight,
  Activity,
  Play,
  Brain,
  Video,
  Mic,
  MapPin,
  Server,
  Globe,
  Users,
  Wrench,
  BarChart3,
  Terminal,
  Eye,
  Loader2,
  RotateCw,
  FileText,
  Link,
  ListChecks,
  GitCommit,
  AlertTriangle
} from 'lucide-react';

interface Props {
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
  onToggleSubTask: (taskId: string, subTaskId: string) => void;
  onAddSubTask: (taskId: string, title: string) => void;
  onRemoveSubTask?: (taskId: string, subTaskId: string) => void;
  onRemoveTask?: (taskId: string) => void;
  onAddTask?: (title: string) => void;
  onUpdateDependencies?: (taskId: string, dependencies: string[]) => void;
  onExecuteTask?: (task: Task) => void; 
  executingTaskIds?: Set<string>; // Level 6.2: Parallel support
}

const AGENT_ICONS: Record<AgentType, any> = {
    [AgentType.OVERSEER]: Brain,
    [AgentType.HR_MANAGER]: Users,
    [AgentType.INTEGRATION_LEAD]: Wrench,
    [AgentType.RESEARCHER]: Globe,
    [AgentType.DATA_ANALYST]: BarChart3,
    [AgentType.DEVELOPER]: Terminal,
    [AgentType.VISIONARY]: Eye,
    [AgentType.DIRECTOR]: Video,
    [AgentType.COMMUNICATOR]: Mic,
    [AgentType.NAVIGATOR]: MapPin,
    [AgentType.SPEEDSTER]: Zap,
    [AgentType.ANTIGRAVITY]: Server,
};

export const TaskBoard: React.FC<Props> = ({ 
  tasks, 
  onToggleTask, 
  onToggleSubTask, 
  onAddSubTask,
  onRemoveSubTask,
  onRemoveTask,
  onAddTask,
  onUpdateDependencies,
  onExecuteTask,
  executingTaskIds
}) => {
  const [expandedTasks, setExpandedTasks] = React.useState<Record<string, boolean>>({});
  const [newSubtaskInputs, setNewSubtaskInputs] = useState<Record<string, string>>({});
  const [newTaskInput, setNewTaskInput] = useState('');
  const [showDependencyEditor, setShowDependencyEditor] = useState<string | null>(null);

  const getTask = (id: string) => tasks.find(t => t.id === id);
  const toggleExpand = (id: string) => setExpandedTasks(prev => ({ ...prev, [id]: !prev[id] }));

  const handleAddSubTaskSubmit = (taskId: string) => {
    const title = newSubtaskInputs[taskId]?.trim();
    if (title) {
      onAddSubTask(taskId, title);
      setNewSubtaskInputs(prev => ({ ...prev, [taskId]: '' }));
    }
  };

  const handleAddTaskSubmit = () => {
    if (newTaskInput.trim() && onAddTask) {
      onAddTask(newTaskInput.trim());
      setNewTaskInput('');
    }
  };

  const getUnmetDependencies = (task: Task) => {
    if (!task.dependencies) return [];
    return task.dependencies.map(depId => getTask(depId)).filter(t => t && !t.completed) as Task[];
  };

  const toggleDependency = (taskId: string, depId: string) => {
    if (!onUpdateDependencies || taskId === depId) return;
    const task = getTask(taskId);
    if (!task) return;
    const currentDeps = task.dependencies || [];
    const newDeps = currentDeps.includes(depId) ? currentDeps.filter(id => id !== depId) : [...currentDeps, depId];
    onUpdateDependencies(taskId, newDeps);
  };

  const scrollToTask = (taskId: string) => {
      const el = document.getElementById(`task-card-${taskId}`);
      if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-2', 'ring-amber-500', 'z-50');
          setTimeout(() => el.classList.remove('ring-2', 'ring-amber-500', 'z-50'), 2000);
      }
  };

  const handleRunParallel = () => {
      if (!onExecuteTask) return;
      tasks.forEach(task => {
          if (!task.completed && task.isParallel && !getUnmetDependencies(task).length) {
              if (!executingTaskIds?.has(task.id)) {
                  onExecuteTask(task);
              }
          }
      });
  };

  const getTaskStatus = (task: Task, isBlocked: boolean, isExecuting: boolean) => {
      if (isExecuting) return { label: 'EXECUTING', color: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500/50', bg: 'bg-cyan-50 dark:bg-cyan-950/20', icon: Loader2, shadow: 'shadow-[0_0_15px_rgba(6,182,212,0.2)]' };
      if (task.status === 'failed') return { label: 'FAILED', color: 'text-red-600 dark:text-red-400', border: 'border-red-500/50', bg: 'bg-red-50 dark:bg-red-950/20', icon: AlertTriangle, shadow: 'shadow-[0_0_15px_rgba(220,38,38,0.2)]' };
      if (task.completed) return { label: 'COMPLETE', color: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-50 dark:bg-emerald-950/10', icon: CircleCheck, shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.1)]' };
      if (isBlocked) return { label: 'BLOCKED', color: 'text-rose-500 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-900/50', bg: 'bg-rose-50 dark:bg-rose-950/20', icon: Lock, shadow: '' };
      if (task.isParallel && !isBlocked && !isExecuting && !task.completed) return { label: 'PARALLEL READY', color: 'text-violet-600 dark:text-violet-400', border: 'border-violet-500/50', bg: 'bg-violet-50 dark:bg-violet-950/20', icon: GitBranch, shadow: 'shadow-[0_0_15px_rgba(139,92,246,0.2)]' };
      if ((task.subtasks || []).some(s => s.completed)) return { label: 'IN PROGRESS', color: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-50 dark:bg-amber-950/10', icon: Activity, shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.1)]' };
      return { label: 'PENDING', color: 'text-zinc-500 dark:text-zinc-400', border: 'border-zinc-200 dark:border-white/5', bg: 'bg-zinc-50 dark:bg-zinc-900/40', icon: Circle, shadow: '' };
  };

  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  // Calculate available parallel tasks for the batch button
  const pendingParallelTasks = tasks.filter(t => !t.completed && t.isParallel && !getUnmetDependencies(t).length && !executingTaskIds?.has(t.id));

  return (
    <div className="bg-white/60 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl overflow-hidden backdrop-blur-md shadow-lg dark:shadow-2xl animate-in fade-in duration-700 w-full relative group/board">
      
      {/* HUD Corners */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-300 dark:border-white/20 rounded-tl-sm"></div>
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-300 dark:border-white/20 rounded-tr-sm"></div>
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-zinc-300 dark:border-white/20 rounded-bl-sm"></div>
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-zinc-300 dark:border-white/20 rounded-br-sm"></div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-zinc-50 dark:bg-white/5 border-b border-zinc-200 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-amber-50 dark:bg-amber-500/10 rounded border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-500 shadow-sm dark:shadow-[0_0_10px_rgba(245,158,11,0.2)]">
             <Workflow size={16} />
          </div>
          <div>
              <div className="text-[10px] font-bold brand-font text-zinc-900 dark:text-zinc-200 tracking-[0.2em] uppercase">Tactical Plan</div>
              <div className="text-[8px] text-zinc-500 font-mono mt-0.5 tracking-wider">EXECUTION SEQUENCE_V3</div>
          </div>
        </div>
        
        {/* Actions / Progress */}
        <div className="flex flex-col items-end gap-1">
            {pendingParallelTasks.length > 1 && onExecuteTask ? (
                <button 
                    onClick={handleRunParallel}
                    className="flex items-center gap-1.5 px-3 py-1 bg-violet-100 dark:bg-violet-950/40 border border-violet-500/30 rounded text-[9px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider hover:bg-violet-200 dark:hover:bg-violet-900/60 transition-all shadow-[0_0_10px_rgba(139,92,246,0.3)] animate-pulse"
                >
                    <Zap size={10} className="fill-current"/> Auto-Run Parallel ({pendingParallelTasks.length})
                </button>
            ) : (
                <>
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-amber-600 dark:text-amber-500 font-bold">{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="h-1 w-24 bg-zinc-200 dark:bg-zinc-900 rounded-sm overflow-hidden border border-zinc-200 dark:border-white/10">
                        <div className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
                    </div>
                </>
            )}
        </div>
      </div>

      <div className="p-3 max-h-[60vh] overflow-y-auto custom-scrollbar relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tasks.map(task => {
            const subtaskCount = (task.subtasks || []).length;
            const completedSubtasks = (task.subtasks || []).filter(t => t.completed).length;
            const unmetDeps = getUnmetDependencies(task);
            const isBlocked = unmetDeps.length > 0;
            const isExpanded = expandedTasks[task.id];
            const isExecuting = executingTaskIds?.has(task.id) || false;
            const status = getTaskStatus(task, isBlocked, isExecuting);
            const StatusIcon = status.icon;
            const subtaskPercent = subtaskCount > 0 ? (completedSubtasks / subtaskCount) * 100 : 0;
            const hasDependencies = (task.dependencies || []).length > 0;
            
            const AssignedIcon = task.assignedAgent ? AGENT_ICONS[task.assignedAgent] : Circle;

            return (
              <div 
                  id={`task-card-${task.id}`} 
                  key={task.id} 
                  className={`group/card rounded-xl border transition-all duration-500 relative overflow-hidden flex flex-col ${status.bg} ${status.border} ${isExpanded ? 'ring-1 ring-zinc-300 dark:ring-white/10 md:col-span-2' : 'col-span-1'} ${status.shadow}`}
              >
                {/* Visual Blocked Overlay Pattern */}
                {isBlocked && (
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(244,63,94,0.05)_5px,rgba(244,63,94,0.05)_10px)] dark:bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(244,63,94,0.05)_5px,rgba(244,63,94,0.05)_10px)] pointer-events-none z-0"></div>
                )}

                {/* Executing Pulse Overlay */}
                {isExecuting && (
                    <div className="absolute inset-0 bg-cyan-500/5 animate-pulse pointer-events-none z-0"></div>
                )}

                <div className="p-3.5 cursor-pointer select-none relative z-10 flex-1" onClick={() => toggleExpand(task.id)}>
                    <div className="flex items-start gap-3">
                        {/* Checkbox / Status Indicator */}
                        <button 
                          disabled={isBlocked || isExecuting} 
                          onClick={(e) => { e.stopPropagation(); if (!isBlocked) onToggleTask(task.id); }} 
                          className={`mt-0.5 shrink-0 w-5 h-5 flex items-center justify-center rounded-md transition-all duration-300 shadow-sm ${task.completed ? 'bg-emerald-500 text-white dark:text-black shadow-[0_0_8px_rgba(16,185,129,0.4)]' : (isBlocked ? 'bg-rose-100 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-rose-400 dark:text-rose-500 cursor-not-allowed' : 'bg-white dark:bg-black/20 border border-zinc-300 dark:border-zinc-600 hover:border-amber-500 text-transparent hover:text-amber-500/50')}`}
                        >
                           {isExecuting ? <Loader2 size={12} className="animate-spin text-cyan-500"/> : isBlocked ? <Lock size={10} /> : <Check size={12} strokeWidth={4} />}
                        </button>
                        
                        <div className="flex-1 min-w-0">
                            {/* Title Row */}
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className={`text-xs font-bold tracking-wide transition-all ${task.completed ? 'text-zinc-400 dark:text-zinc-500 line-through' : (isBlocked ? 'text-zinc-500' : 'text-zinc-800 dark:text-zinc-200')}`}>{task.title}</span>
                                <div className="flex items-center gap-1.5">
                                    {/* Indicators */}
                                    {task.isParallel && (
                                        <div className="p-1 rounded bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 animate-pulse" title="Parallel Execution Enabled">
                                            <GitBranch size={10} />
                                        </div>
                                    )}
                                    {hasDependencies && (
                                        <div className={`p-1 rounded border flex items-center gap-1 ${isBlocked ? 'bg-rose-100 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400' : 'bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-zinc-400'}`} title={`${task.dependencies?.length} Dependencies`}>
                                            <Link size={10} />
                                            <span className="text-[8px] font-mono">{task.dependencies?.length}</span>
                                        </div>
                                    )}
                                    {task.assignedAgent && (
                                        <div className="p-1 rounded bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-zinc-400" title={`Assigned to ${task.assignedAgent}`}>
                                            <AssignedIcon size={10} />
                                        </div>
                                    )}
                                    <div className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border ${status.border} ${status.color} bg-white/50 dark:bg-black/20`}>{status.label}</div>
                                </div>
                            </div>
                            
                            {/* Subtask Tactical Display */}
                            {subtaskCount > 0 && (
                                <div className={`mt-3 rounded-lg p-2.5 border transition-colors ${task.completed ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-500/10' : 'bg-zinc-100/50 dark:bg-zinc-900/40 border-white/5'}`}>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <div className="flex items-center gap-2">
                                            {/* Radial Progress */}
                                            <div className="relative w-4 h-4">
                                                <svg className="w-full h-full -rotate-90">
                                                    <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-300 dark:text-zinc-800" />
                                                    <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2"
                                                        strokeDasharray={37.7} strokeDashoffset={37.7 - (37.7 * subtaskPercent) / 100}
                                                        className={`transition-all duration-500 ${task.completed ? 'text-emerald-500' : isExecuting ? 'text-cyan-500' : 'text-amber-500'}`} />
                                                </svg>
                                            </div>
                                            <span className={`text-[9px] font-mono tracking-wide ${task.completed ? 'text-emerald-600 dark:text-emerald-500' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                                {completedSubtasks}/{subtaskCount} Sub-ops
                                            </span>
                                        </div>
                                        <span className={`text-[9px] font-bold ${task.completed ? 'text-emerald-600 dark:text-emerald-500' : 'text-zinc-500'}`}>{Math.round(subtaskPercent)}%</span>
                                    </div>
                                    
                                    {/* Segmented vs Continuous Bar */}
                                    {subtaskCount <= 15 ? (
                                        <div className="flex gap-0.5 h-1 w-full mt-1.5">
                                            {(task.subtasks || []).map((st, i) => (
                                                <div key={i} className={`flex-1 rounded-full transition-colors duration-300 ${st.completed ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-800'}`}></div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-1 w-full bg-zinc-300 dark:bg-zinc-800 rounded-full overflow-hidden mt-1.5">
                                            <div className={`h-full transition-all duration-500 rounded-full ${task.completed ? 'bg-emerald-500' : isExecuting ? 'bg-cyan-500 animate-pulse' : 'bg-amber-500'}`} style={{ width: `${subtaskPercent}%` }}></div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {task.isParallel && !subtaskCount && (
                                <div className="mt-1 text-[9px] text-violet-600 dark:text-violet-500 font-mono flex items-center gap-1 uppercase tracking-wider animate-pulse">
                                    <GitBranch size={8}/> Parallel Execution Enabled
                                </div>
                            )}

                            {/* Blocked Warning - Dependency Graph Style */}
                            {isBlocked && (
                                <div className="mt-3 pl-3 py-1 border-l-[1.5px] border-rose-500/30">
                                    <div className="text-[9px] text-rose-600 dark:text-rose-500/90 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                        <Lock size={10} /> Blocked by Dependencies
                                    </div>
                                    <div className="flex flex-col gap-1.5 relative">
                                        {/* Faint connecting line behind items */}
                                        <div className="absolute left-[5px] top-2 bottom-4 w-px bg-zinc-300 dark:bg-zinc-800 z-0"></div>
                                        {unmetDeps.map((d, i) => (
                                            <div key={d.id} className="flex items-start gap-2 group/dep relative z-10">
                                                <div className="mt-1 bg-zinc-50 dark:bg-black/50 p-0.5 rounded-full"><CornerDownRight size={10} className="text-zinc-400 dark:text-zinc-600" /></div>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); scrollToTask(d.id); }}
                                                    className="flex-1 text-left flex items-center justify-between p-2 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-rose-500/30 transition-all shadow-sm"
                                                >
                                                    <span className="text-[10px] text-zinc-600 dark:text-zinc-400 group-hover/dep:text-zinc-900 dark:group-hover/dep:text-zinc-200 truncate pr-2">{d.title}</span>
                                                    <span className="text-[8px] px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-500 group-hover/dep:bg-rose-500/10 group-hover/dep:text-rose-600 dark:group-hover/dep:text-rose-500 font-mono shrink-0">PENDING</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Execution Result Log */}
                            {(task.completed || task.status === 'failed') && task.output && (
                                <div className={`mt-2 rounded-lg p-2.5 border ${task.status === 'failed' ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50' : 'bg-zinc-100 dark:bg-black/50 border-zinc-200 dark:border-zinc-800'}`}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className={`text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 ${task.status === 'failed' ? 'text-red-600 dark:text-red-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                            {task.status === 'failed' ? <AlertTriangle size={10} /> : <FileText size={10} />} 
                                            {task.status === 'failed' ? 'Error Log' : 'Execution Log'}
                                        </span>
                                        {onExecuteTask && !isExecuting && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onExecuteTask(task); }}
                                                className="text-[9px] text-amber-600 dark:text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-colors uppercase tracking-wider"
                                                title="Rerun Agent"
                                            >
                                                <RotateCw size={10} /> Retry
                                            </button>
                                        )}
                                    </div>
                                    <div className={`text-[10px] font-mono whitespace-pre-wrap leading-tight max-h-32 overflow-y-auto custom-scrollbar opacity-90 ${task.status === 'failed' ? 'text-red-700 dark:text-red-300' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                        {task.output.length > 250 ? task.output.substring(0, 250) + "..." : task.output}
                                    </div>
                                </div>
                            )}

                            {/* Auto-Pilot Executor */}
                            {!isBlocked && !task.completed && task.status !== 'failed' && onExecuteTask && !isExecuting && (
                               <div className="mt-3 flex">
                                   <button 
                                      onClick={(e) => { e.stopPropagation(); onExecuteTask(task); }}
                                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-bold text-[10px] uppercase tracking-wider transition-all shadow-md hover:shadow-lg group/run border border-transparent"
                                   >
                                       <Play size={10} className="fill-current" /> Auto-Run Agent
                                   </button>
                               </div>
                            )}
                        </div>
                        
                        <button onClick={() => toggleExpand(task.id)} className={`text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-transform p-1 ${isExpanded ? 'rotate-180' : ''}`}><ChevronDown size={14} /></button>
                    </div>
                </div>

                {isExpanded && (
                    <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-1 duration-300 relative z-20">
                         <div className="border-t border-zinc-200 dark:border-white/5 pt-3 pl-8">
                             {/* Dependency Editor Toggle */}
                             <div className="flex justify-end mb-2">
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); setShowDependencyEditor(showDependencyEditor === task.id ? null : task.id); }} 
                                   className={`text-[9px] font-bold text-zinc-500 hover:text-amber-600 dark:hover:text-amber-500 flex items-center gap-1 transition-colors uppercase tracking-wider px-2 py-1 rounded ${showDependencyEditor === task.id ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500' : 'hover:bg-zinc-100 dark:hover:bg-white/5'}`}
                                 >
                                    <Workflow size={10} /> {showDependencyEditor === task.id ? 'Close Logic' : 'Edit Logic'}
                                 </button>
                             </div>

                             {/* Dependency Editor Panel */}
                             {showDependencyEditor === task.id && (
                                 <div className="bg-zinc-50 dark:bg-black/40 rounded-lg border border-zinc-200 dark:border-white/10 p-3 mb-3 animate-in fade-in slide-in-from-top-1">
                                     <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1"><GitCommit size={10}/> Link Dependencies</div>
                                     <div className="grid gap-1 max-h-32 overflow-y-auto custom-scrollbar">
                                         {tasks.filter(t => t.id !== task.id).map(t => {
                                              const isDep = (task.dependencies || []).includes(t.id);
                                              return (
                                                  <button 
                                                    key={t.id} 
                                                    onClick={() => toggleDependency(task.id, t.id)} 
                                                    className={`flex items-center justify-between text-[9px] px-2 py-1.5 rounded-md transition-all text-left border ${ isDep ? 'bg-amber-100 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-400 shadow-sm' : 'bg-white dark:bg-white/5 border-transparent text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10' }`}
                                                  >
                                                      <span className="truncate flex items-center gap-1.5">
                                                          <Circle size={8} className={isDep ? "text-amber-500 fill-current" : "text-zinc-300 dark:text-zinc-700"} /> 
                                                          {t.title}
                                                      </span>
                                                      {isDep && <CircleCheck size={10} className="text-amber-500" />}
                                                  </button>
                                              )
                                         })}
                                     </div>
                                 </div>
                             )}

                             {/* Subtasks List */}
                             <div className="space-y-1">
                                 {(task.subtasks || []).map(subtask => (
                                     <div key={subtask.id} className="flex items-center gap-2 group/sub py-1 px-2 rounded-md hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                                         <button disabled={isBlocked} onClick={() => !isBlocked && onToggleSubTask(task.id, subtask.id)} className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${subtask.completed ? 'bg-emerald-500 border-emerald-500 text-white dark:text-black' : (isBlocked ? 'border-zinc-300 dark:border-zinc-800 bg-zinc-200 dark:bg-zinc-900' : 'border-zinc-300 dark:border-zinc-600 bg-white dark:bg-black hover:border-amber-500')}`}>
                                             {subtask.completed && <Check size={8} strokeWidth={4} />}
                                         </button>
                                         <span className={`text-[10px] flex-1 ${subtask.completed ? 'text-zinc-400 line-through' : 'text-zinc-700 dark:text-zinc-300'}`}>{subtask.title}</span>
                                         {onRemoveSubTask && !isBlocked && <button onClick={() => onRemoveSubTask(task.id, subtask.id)} className="text-zinc-400 hover:text-red-500 opacity-0 group-hover/sub:opacity-100 transition-opacity"><Trash2 size={10} /></button>}
                                     </div>
                                 ))}
                                 
                                 {/* Add Subtask Input */}
                                 {!isBlocked && (
                                    <div className="flex items-center gap-2 mt-2 px-2 group/input">
                                       <CornerDownRight size={10} className="text-zinc-400" />
                                       <input 
                                         type="text" 
                                         value={newSubtaskInputs[task.id] || ''} 
                                         onChange={(e) => setNewSubtaskInputs(prev => ({ ...prev, [task.id]: e.target.value }))} 
                                         onKeyDown={(e) => e.key === 'Enter' && handleAddSubTaskSubmit(task.id)} 
                                         placeholder="Add sub-routine..." 
                                         className="w-full bg-transparent border-b border-zinc-200 dark:border-zinc-800 focus:border-amber-500/50 text-[10px] text-zinc-800 dark:text-zinc-300 placeholder-zinc-400 dark:placeholder-zinc-700 py-1 outline-none transition-all font-mono" 
                                       />
                                    </div>
                                 )}
                             </div>
                         </div>
                    </div>
                )}
              </div>
            );
          })}

          {onAddTask && (
            <div className="col-span-1 md:col-span-2 flex items-center gap-3 px-4 py-3 border border-dashed border-zinc-300 dark:border-white/10 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors group/new">
               <button onClick={handleAddTaskSubmit} className="w-5 h-5 rounded-md border border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-amber-500 hover:border-amber-500/50 transition-all">
                   <Plus size={12} />
               </button>
               <input 
                  type="text" 
                  value={newTaskInput} 
                  onChange={(e) => setNewTaskInput(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTaskSubmit()} 
                  placeholder="Initialize new directive..." 
                  className="flex-1 bg-transparent text-xs text-zinc-600 dark:text-zinc-400 placeholder-zinc-400 dark:placeholder-zinc-700 outline-none" 
               />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};