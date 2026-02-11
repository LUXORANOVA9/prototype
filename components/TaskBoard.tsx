import React, { useState } from 'react';
import { Task, AgentType } from '../types';
import { 
  CheckCircle2, 
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
  FileText
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
      if (task.completed) return { label: 'COMPLETE', color: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-50 dark:bg-emerald-950/10', icon: CheckCircle2, shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.1)]' };
      if (isBlocked) return { label: 'LOCKED', color: 'text-zinc-500', border: 'border-zinc-200 dark:border-zinc-800', bg: 'bg-zinc-100 dark:bg-zinc-950/50', icon: Lock, shadow: '' };
      if (task.subtasks.some(s => s.completed) || task.isParallel) return { label: 'ACTIVE', color: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-50 dark:bg-amber-950/10', icon: Activity, shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.1)]' };
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
                    className="flex items-center gap-1.5 px-3 py-1 bg-cyan-100 dark:bg-cyan-950/40 border border-cyan-500/30 rounded text-[9px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider hover:bg-cyan-200 dark:hover:bg-cyan-900/60 transition-all shadow-[0_0_10px_rgba(6,182,212,0.3)] animate-pulse"
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

      <div className="p-3 space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar relative">
        {tasks.map(task => {
          const subtaskCount = task.subtasks.length;
          const completedSubtasks = task.subtasks.filter(t => t.completed).length;
          const unmetDeps = getUnmetDependencies(task);
          const isBlocked = unmetDeps.length > 0;
          const isExpanded = expandedTasks[task.id];
          const isExecuting = executingTaskIds?.has(task.id) || false;
          const status = getTaskStatus(task, isBlocked, isExecuting);
          const StatusIcon = status.icon;
          const subtaskPercent = subtaskCount > 0 ? (completedSubtasks / subtaskCount) * 100 : 0;
          
          const AssignedIcon = task.assignedAgent ? AGENT_ICONS[task.assignedAgent] : Circle;

          return (
            <div 
                id={`task-card-${task.id}`} 
                key={task.id} 
                className={`group/card rounded-lg border transition-all duration-500 relative overflow-hidden ${status.bg} ${status.border} ${isExpanded ? 'ring-1 ring-zinc-300 dark:ring-white/10' : ''} ${status.shadow} ${isBlocked ? 'opacity-70' : ''}`}
            >
              {/* Progress Background Overlay */}
              {!isBlocked && !task.completed && subtaskPercent > 0 && !isExecuting && (
                  <div className="absolute left-0 top-0 bottom-0 bg-amber-500/5 transition-all duration-700 pointer-events-none" style={{ width: `${subtaskPercent}%` }}></div>
              )}
              {isExecuting && (
                  <div className="absolute inset-0 bg-cyan-500/5 animate-pulse pointer-events-none"></div>
              )}

              <div className="p-3 cursor-pointer select-none relative z-10" onClick={() => toggleExpand(task.id)}>
                  <div className="flex items-start gap-3">
                      {/* Checkbox / Status Indicator */}
                      <button 
                        disabled={isBlocked || isExecuting} 
                        onClick={(e) => { e.stopPropagation(); if (!isBlocked) onToggleTask(task.id); }} 
                        className={`mt-0.5 shrink-0 w-5 h-5 flex items-center justify-center rounded transition-all duration-300 ${task.completed ? 'bg-emerald-500 text-white dark:text-black' : (isBlocked ? 'bg-zinc-200 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-400 dark:text-zinc-600' : 'bg-white dark:bg-black/40 border border-zinc-300 dark:border-zinc-600 hover:border-amber-500 text-transparent hover:text-amber-500/50')}`}
                      >
                         {isExecuting ? <Loader2 size={12} className="animate-spin text-cyan-500"/> : <Check size={12} strokeWidth={4} />}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                              <span className={`text-xs font-bold tracking-wide transition-all ${task.completed ? 'text-zinc-400 dark:text-zinc-500 line-through' : (isBlocked ? 'text-zinc-500' : 'text-zinc-800 dark:text-zinc-200')}`}>{task.title}</span>
                              <div className="flex items-center gap-1">
                                  {task.assignedAgent && (
                                      <div className="p-1 rounded bg-zinc-200 dark:bg-black border border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400" title={`Assigned to ${task.assignedAgent}`}>
                                          <AssignedIcon size={10} />
                                      </div>
                                  )}
                                  <div className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border ${status.border} ${status.color} bg-white dark:bg-black/40`}>{status.label}</div>
                              </div>
                          </div>
                          
                          <div className="flex items-center gap-3 text-[9px] text-zinc-500 dark:text-zinc-600 font-mono">
                              {subtaskCount > 0 && <span>{completedSubtasks}/{subtaskCount} Sub-ops</span>}
                              {task.isParallel && <span className="text-cyan-600 flex items-center gap-1"><Zap size={8}/> ASYNC</span>}
                          </div>

                          {/* Blocked Warning */}
                          {isBlocked && (
                              <div className="mt-2 flex flex-col gap-1 p-2 bg-zinc-100 dark:bg-black/40 rounded border border-zinc-200 dark:border-zinc-800">
                                 <div className="flex items-center gap-1 text-[9px] text-amber-700 font-bold uppercase tracking-wider">
                                     <Lock size={8} /> Awaiting Prerequisites
                                 </div>
                                 {unmetDeps.map(d => (
                                    <div key={d.id} onClick={(e) => { e.stopPropagation(); scrollToTask(d.id); }} className="flex items-center gap-1 text-[9px] text-zinc-500 hover:text-amber-600 dark:hover:text-amber-500 cursor-pointer transition-colors">
                                        <CornerDownRight size={8} /> {d.title}
                                    </div>
                                 ))}
                              </div>
                          )}

                          {/* Execution Result Log (Level 6.3) */}
                          {task.completed && task.output && (
                              <div className="mt-2 bg-zinc-100 dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5">
                                  <div className="flex items-center justify-between mb-1.5">
                                      <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                                          <FileText size={10} /> Execution Log
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
                                  <div className="text-[10px] font-mono text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-tight max-h-32 overflow-y-auto custom-scrollbar opacity-90">
                                      {task.output.length > 250 ? task.output.substring(0, 250) + "..." : task.output}
                                  </div>
                              </div>
                          )}

                          {/* Level 6: Auto-Pilot Executor (Hidden if already completed, unless expanded? Logic above allows retry inside box) */}
                          {!isBlocked && !task.completed && onExecuteTask && !isExecuting && (
                             <div className="mt-2 flex">
                                 <button 
                                    onClick={(e) => { e.stopPropagation(); onExecuteTask(task); }}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-white dark:text-black font-bold text-[10px] uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] group/run"
                                 >
                                     <Play size={10} className="fill-current" /> Auto-Run Agent
                                 </button>
                             </div>
                          )}
                      </div>
                      
                      <button onClick={() => toggleExpand(task.id)} className={`text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`}><ChevronDown size={14} /></button>
                  </div>
              </div>

              {isExpanded && (
                  <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-1 duration-300 relative z-20">
                       <div className="border-t border-zinc-200 dark:border-white/5 pt-3 pl-8">
                           {/* Dependency Toggle */}
                           <div className="flex justify-end mb-2">
                               <button 
                                 onClick={(e) => { e.stopPropagation(); setShowDependencyEditor(showDependencyEditor === task.id ? null : task.id); }} 
                                 className="text-[9px] font-mono text-zinc-500 hover:text-amber-600 dark:hover:text-amber-500 flex items-center gap-1 transition-colors uppercase tracking-wider"
                               >
                                  <Workflow size={10} /> {showDependencyEditor === task.id ? 'Hide Logic' : 'Edit Logic'}
                               </button>
                           </div>

                           {/* Dependency Editor */}
                           {showDependencyEditor === task.id && (
                               <div className="bg-zinc-100 dark:bg-black/60 rounded border border-zinc-200 dark:border-white/10 p-2 mb-3">
                                   <div className="grid gap-1">
                                       {tasks.filter(t => t.id !== task.id).map(t => {
                                            const isDep = (task.dependencies || []).includes(t.id);
                                            return (
                                                <button key={t.id} onClick={() => toggleDependency(task.id, t.id)} className={`flex items-center justify-between text-[9px] px-2 py-1.5 rounded border transition-all text-left ${ isDep ? 'bg-amber-100 dark:bg-amber-900/20 border-amber-300 dark:border-amber-500/30 text-amber-600 dark:text-amber-500' : 'bg-transparent border-transparent text-zinc-500 hover:bg-zinc-200 dark:hover:bg-white/5' }`}>
                                                    <span className="truncate">{t.title}</span>
                                                    {isDep && <Check size={10} />}
                                                </button>
                                            )
                                       })}
                                   </div>
                               </div>
                           )}

                           {/* Subtasks */}
                           <div className="space-y-1">
                               {task.subtasks.map(subtask => (
                                   <div key={subtask.id} className="flex items-center gap-2 group/sub py-1">
                                       <button disabled={isBlocked} onClick={() => !isBlocked && onToggleSubTask(task.id, subtask.id)} className={`w-3 h-3 rounded-sm border flex items-center justify-center transition-all ${subtask.completed ? 'bg-amber-500 border-amber-500 text-white dark:text-black' : (isBlocked ? 'border-zinc-300 dark:border-zinc-800 bg-zinc-200 dark:bg-zinc-900' : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-black hover:border-amber-500')}`}>
                                           {subtask.completed && <Check size={8} strokeWidth={4} />}
                                       </button>
                                       <span className={`text-[10px] flex-1 ${subtask.completed ? 'text-zinc-400 line-through' : 'text-zinc-600 dark:text-zinc-400'}`}>{subtask.title}</span>
                                       {onRemoveSubTask && !isBlocked && <button onClick={() => onRemoveSubTask(task.id, subtask.id)} className="text-zinc-400 hover:text-red-500 opacity-0 group-hover/sub:opacity-100"><Trash2 size={10} /></button>}
                                   </div>
                               ))}
                               
                               {/* Add Subtask */}
                               {!isBlocked && (
                                  <div className="flex items-center gap-2 mt-2 group/input">
                                     <CornerDownRight size={10} className="text-zinc-400 ml-1" />
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
          <div className="flex items-center gap-3 px-4 py-3 border border-dashed border-zinc-300 dark:border-white/10 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/[0.02] transition-colors group/new">
             <Plus size={14} className="text-zinc-400 group-hover/new:text-amber-500 transition-colors" />
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
  );
};