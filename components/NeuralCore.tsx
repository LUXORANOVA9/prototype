// @ts-nocheck
/// <reference types="@react-three/fiber" />
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { memoryService } from '../services/memoryService';
import { MemoryNode } from '../types';
import { BrainCircuit, Search, Plus, Tag, Database, Zap, X, Cpu, Share2, Sparkles, Trash2, Pin, PinOff, Network, List } from 'lucide-react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { ThreeElements } from '@react-three/fiber';

declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

interface Props {
  onClose: () => void;
  className?: string;
}

interface SimulationNode extends MemoryNode {
  x: number;
  y: number;
  z?: number;
  vx: number;
  vy: number;
  vz?: number;
  radius: number;
}

// --- 3D Graph Visualization Sub-component ---
const NodeMesh: React.FC<{ 
    node: SimulationNode, 
    isHovered: boolean, 
    onHover: (node: SimulationNode | null) => void,
    onClick: (id: string) => void 
}> = ({ node, isHovered, onHover, onClick }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const color = node.type === 'user_fact' ? '#3b82f6' : node.type === 'system_note' ? '#f59e0b' : '#a855f7';
    const radius = node.isPinned ? 0.6 : 0.3 + (node.relevance || 0) * 0.4;

    useFrame(() => {
        if (meshRef.current) {
            // Gentle floating animation
            meshRef.current.position.y += Math.sin(Date.now() * 0.001 + node.id.charCodeAt(0)) * 0.002;
        }
    });

    return (
        <group position={[node.x, node.y, node.z || 0]}>
            <mesh 
                ref={meshRef}
                onPointerOver={(e) => { e.stopPropagation(); onHover(node); }}
                onPointerOut={(e) => { e.stopPropagation(); onHover(null); }}
                onClick={(e) => { e.stopPropagation(); onClick(node.id); }}
            >
                <sphereGeometry args={[radius, 32, 32]} />
                <meshStandardMaterial 
                    color={color} 
                    emissive={color}
                    emissiveIntensity={isHovered ? 1.5 : 0.5}
                    transparent
                    opacity={0.9}
                />
            </mesh>
            {/* Outer Glow */}
            <mesh>
                <sphereGeometry args={[radius * 1.5, 16, 16]} />
                <meshBasicMaterial color={color} transparent opacity={isHovered ? 0.3 : 0.1} depthWrite={false} />
            </mesh>
        </group>
    );
};

const Edges: React.FC<{ nodes: SimulationNode[] }> = ({ nodes }) => {
    const lines = useMemo(() => {
        const result: { start: THREE.Vector3, end: THREE.Vector3, color: string }[] = [];
        nodes.forEach((node, i) => {
            nodes.slice(i + 1).forEach(other => {
                const shareTag = node.tags.some(t => other.tags.includes(t));
                const sameType = node.type === other.type;
                
                const dist = Math.hypot(node.x - other.x, node.y - other.y, (node.z || 0) - (other.z || 0));
                
                if ((shareTag || sameType) && dist < 15) {
                    result.push({
                        start: new THREE.Vector3(node.x, node.y, node.z || 0),
                        end: new THREE.Vector3(other.x, other.y, other.z || 0),
                        color: shareTag ? '#a855f7' : '#ffffff'
                    });
                }
            });
        });
        return result;
    }, [nodes]);

    return (
        <group>
            {lines.map((line, i) => {
                const points = [line.start, line.end];
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                return (
                    <group key={i}>
                        <line geometry={geometry}>
                            <lineBasicMaterial color={line.color} transparent opacity={0.1} />
                        </line>
                        {/* Synaptic Pulse */}
                        <PulsePoint start={line.start} end={line.end} color={line.color} />
                    </group>
                );
            })}
        </group>
    );
};

const PulsePoint: React.FC<{ start: THREE.Vector3, end: THREE.Vector3, color: string }> = ({ start, end, color }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [progress, setProgress] = useState(Math.random());
    const speed = 0.002 + Math.random() * 0.003;

    useFrame(() => {
        if (meshRef.current) {
            const nextProgress = (progress + speed) % 1;
            setProgress(nextProgress);
            meshRef.current.position.lerpVectors(start, end, nextProgress);
        }
    });

    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshBasicMaterial color={color} transparent opacity={0.6} />
        </mesh>
    );
};

const VectorGraph3D: React.FC<{ memories: MemoryNode[], onSelect: (id: string) => void }> = ({ memories, onSelect }) => {
    const [hoveredNode, setHoveredNode] = useState<SimulationNode | null>(null);

    // Generate 3D positions
    const nodes = useMemo<SimulationNode[]>(() => {
        return memories.map(m => {
            // Use a seeded random or hash based on ID to keep positions stable
            let hash = m.id.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
            const random = () => {
                const x = Math.sin(hash++) * 10000;
                return x - Math.floor(x);
            };
            
            return {
                ...m,
                x: (random() - 0.5) * 40,
                y: (random() - 0.5) * 40,
                z: (random() - 0.5) * 40,
                vx: 0, vy: 0, radius: 1
            };
        });
    }, [memories]);

    return (
        <div className="relative w-full h-full bg-zinc-50 dark:bg-[#050505] overflow-hidden group">
            <Canvas camera={{ position: [0, 0, 50], fov: 60 }}>
                <ambientLight intensity={0.2} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <OrbitControls enableDamping dampingFactor={0.05} />
                
                <group>
                    {nodes.map(node => (
                        <NodeMesh 
                            key={node.id} 
                            node={node} 
                            isHovered={hoveredNode?.id === node.id}
                            onHover={setHoveredNode}
                            onClick={onSelect}
                        />
                    ))}
                    <Edges nodes={nodes} />
                </group>
            </Canvas>
            
            {/* HUD Overlay */}
            <div className="absolute bottom-4 left-4 pointer-events-none z-10">
                <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-1">3D Vector Space</div>
                <div className="flex items-center gap-4 text-[9px] text-zinc-500">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> User Facts</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> System Notes</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Interactions</div>
                </div>
                <div className="text-[8px] text-zinc-600 mt-2">Drag to rotate • Scroll to zoom</div>
            </div>

            {/* Hover Tooltip */}
            {hoveredNode && (
                <div 
                    className="absolute z-20 p-3 bg-white/90 dark:bg-black/90 backdrop-blur border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl max-w-[250px] pointer-events-none animate-in fade-in zoom-in-95 duration-200"
                    style={{ left: '50%', top: '20%', transform: 'translate(-50%, -50%)' }}
                >
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                        {hoveredNode.isPinned && <Pin size={8} className="text-amber-500" />}
                        {new Date(hoveredNode.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-xs text-zinc-800 dark:text-zinc-200 line-clamp-4 leading-relaxed">
                        {hoveredNode.content}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                        {hoveredNode.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[8px] px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-500">{tag}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export const NeuralCore: React.FC<Props> = ({ onClose, className }) => {
  const [memories, setMemories] = useState<MemoryNode[]>([]);
  const [pinnedMemories, setPinnedMemories] = useState<MemoryNode[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMemory, setNewMemory] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setMemories(memoryService.getRecent(50)); // Load more for graph
    setPinnedMemories(memoryService.getPinned());
  };

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      loadData();
      return;
    }
    
    setIsSearching(true);
    try {
      const results = await memoryService.search(q, 20);
      setMemories(results); 
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMemory = async () => {
    if (!newMemory.trim()) return;
    await memoryService.addMemory(newMemory, 'user_fact', ['manual']);
    setNewMemory('');
    if (searchQuery) handleSearch(searchQuery);
    else loadData();
  };

  const handleTogglePin = (id: string) => {
      memoryService.togglePin(id);
      loadData();
  };

  const handleDelete = (id: string) => {
      memoryService.deleteMemory(id);
      loadData();
  };

  const handleClear = () => {
    if (confirm('Execute Core Wipe? This will remove all UNPINNED memories.')) {
        memoryService.clear();
        loadData();
    }
  };

  const renderMemoryCard = (mem: MemoryNode) => (
      <div 
        key={mem.id} 
        className={`group relative p-4 rounded-xl border transition-all cursor-default overflow-hidden animate-in slide-in-from-bottom-2 duration-500 shadow-sm dark:shadow-none ${
            mem.isPinned 
            ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50' 
            : 'bg-white dark:bg-zinc-950/80 border-zinc-200 dark:border-zinc-800 hover:border-purple-300 dark:hover:border-purple-500/40 hover:bg-zinc-50 dark:hover:bg-zinc-900'
        }`}
      >
          {/* Decorative sidebar */}
          <div className={`absolute left-0 top-0 bottom-0 w-1 ${mem.isPinned ? 'bg-amber-500' : (mem.relevance > 0.7 ? 'bg-purple-500 shadow-[0_0_10px_#a855f7]' : 'bg-zinc-300 dark:bg-zinc-800 group-hover:bg-purple-400 dark:group-hover:bg-purple-500/50')} transition-colors`}></div>

          <div className="flex items-start justify-between mb-2 pl-3">
              <div className="flex items-center gap-2">
                  {mem.type === 'system_note' ? <Cpu size={12} className={mem.isPinned ? "text-amber-600" : "text-zinc-500"}/> : <Sparkles size={12} className="text-blue-500 dark:text-blue-400"/>}
                  <span className={`text-[9px] font-mono uppercase tracking-wider ${mem.isPinned ? 'text-amber-700 dark:text-amber-500 font-bold' : 'text-zinc-500'}`}>
                      {mem.isPinned ? 'PINNED CONTEXT' : mem.type.replace('_', ' ')}
                  </span>
              </div>
              <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">{new Date(mem.timestamp).toLocaleTimeString()}</span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button onClick={() => handleTogglePin(mem.id)} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-zinc-500 hover:text-amber-600 dark:hover:text-amber-500">
                          {mem.isPinned ? <PinOff size={12}/> : <Pin size={12}/>}
                      </button>
                      <button onClick={() => handleDelete(mem.id)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-zinc-500 hover:text-red-500">
                          <Trash2 size={12}/>
                      </button>
                  </div>
              </div>
          </div>
          
          <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-light pl-3 border-l border-zinc-200 dark:border-white/5">{mem.content}</p>
          
          <div className="flex items-center justify-between mt-3 pl-3">
              <div className="flex flex-wrap gap-1">
                  {mem.tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-zinc-800 text-zinc-500 font-mono">
                          <Tag size={8} /> {tag}
                      </span>
                  ))}
              </div>
              {mem.relevance > 0 && (
                  <div className="text-[9px] font-bold font-mono text-purple-600 dark:text-purple-400 flex items-center gap-1">
                      <Share2 size={10} /> {Math.round(mem.relevance * 100)}%
                  </div>
              )}
          </div>
      </div>
  );

  return (
    <div className={`flex flex-col h-full bg-white/50 dark:bg-black/50 backdrop-blur-xl border-l border-zinc-200 dark:border-white/10 ${className || ''}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200 dark:border-white/10 bg-gradient-to-r from-zinc-50/50 dark:from-zinc-900/50 to-transparent shrink-0">
        <div className="flex items-center gap-4">
           <div className="relative">
               <div className="absolute inset-0 bg-purple-500 blur-lg opacity-20 animate-pulse"></div>
               <div className="p-2.5 bg-white dark:bg-black rounded-lg border border-purple-200 dark:border-purple-500/40 text-purple-600 dark:text-purple-400 relative z-10">
                   <BrainCircuit size={20} />
               </div>
           </div>
           <div>
               <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 brand-font tracking-[0.2em] uppercase">Neural Core</h3>
               <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono mt-0.5">
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]"></span>
                   <span>VECTOR STORE LINKED</span>
               </div>
           </div>
        </div>
        
        <div className="flex items-center gap-3">
             {/* View Toggle */}
             <div className="bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 flex">
                 <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-zinc-700 text-black dark:text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}>
                     <List size={14}/>
                 </button>
                 <button onClick={() => setViewMode('graph')} className={`p-1.5 rounded-md transition-all ${viewMode === 'graph' ? 'bg-white dark:bg-zinc-700 text-black dark:text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}>
                     <Network size={14}/>
                 </button>
             </div>

            <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-colors">
                <X size={20} />
            </button>
        </div>
      </div>

      {/* Input Deck */}
      <div className="p-5 space-y-4 border-b border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-900/20 shrink-0">
          <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
              <div className="relative flex items-center bg-white dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded-xl group-focus-within:border-purple-500/50 transition-colors">
                  <Search size={14} className="ml-3 text-zinc-400 dark:text-zinc-600" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Query vector embeddings..."
                    className="w-full bg-transparent border-none py-3 px-3 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none placeholder-zinc-400 dark:placeholder-zinc-700 font-mono tracking-wide"
                  />
                  {isSearching && <Zap size={12} className="mr-3 text-amber-500 animate-pulse" />}
              </div>
          </div>

          <div className="flex gap-2">
              <input 
                 type="text" 
                 value={newMemory}
                 onChange={(e) => setNewMemory(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleAddMemory()}
                 placeholder="Inject raw data..."
                 className="flex-1 bg-white dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-800 dark:text-zinc-300 focus:border-purple-500/50 outline-none transition-all placeholder-zinc-400 dark:placeholder-zinc-700 font-mono"
              />
              <button 
                 onClick={handleAddMemory}
                 disabled={!newMemory.trim()}
                 className="p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg dark:shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)]"
              >
                  <Plus size={16} />
              </button>
          </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden bg-zinc-50 dark:bg-[#09090b] relative">
          
          {viewMode === 'list' ? (
              <div className="h-full overflow-y-auto custom-scrollbar p-4 space-y-3">
                  {/* Pinned Section */}
                  {!searchQuery && pinnedMemories.length > 0 && (
                      <div className="mb-6 space-y-3">
                          <div className="flex items-center gap-2 px-2 text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest">
                              <Pin size={10} className="fill-current"/> Persistent Context
                          </div>
                          {pinnedMemories.map(renderMemoryCard)}
                          <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-4 mx-2"></div>
                      </div>
                  )}

                  {memories.length === 0 && pinnedMemories.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 text-zinc-400 dark:text-zinc-700 gap-4">
                          <div className="w-16 h-16 rounded-full border border-zinc-300 dark:border-zinc-800 flex items-center justify-center">
                             <Database size={24} className="opacity-40" />
                          </div>
                          <span className="text-[10px] font-mono tracking-widest uppercase">No Data Fragments</span>
                      </div>
                  ) : (
                      memories.filter(m => !m.isPinned).map(renderMemoryCard)
                  )}
              </div>
          ) : (
              // Graph Mode
              <VectorGraph3D 
                 memories={[...pinnedMemories, ...memories]} 
                 onSelect={(id) => {
                     // In a real app, maybe scroll to it in list or show detail modal
                     console.log("Selected Node:", id);
                 }} 
              />
          )}

      </div>

      {/* Footer / Stats */}
      <div className="p-4 border-t border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-zinc-950/90 backdrop-blur shrink-0">
          <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono mb-3 uppercase tracking-wider">
              <span>Node Capacity</span>
              <span>{memories.length + pinnedMemories.length} / 200</span>
          </div>
          <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-900 rounded-full overflow-hidden mb-4 border border-zinc-200 dark:border-white/5">
              <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 dark:from-purple-800 dark:to-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]" style={{ width: `${((memories.length + pinnedMemories.length) / 200) * 100}%` }}></div>
          </div>
          <button onClick={handleClear} className="w-full py-2.5 text-[10px] font-bold tracking-widest text-red-600 dark:text-red-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all border border-transparent hover:border-red-200 dark:hover:border-red-900/30 uppercase flex items-center justify-center gap-2">
              <Trash2 size={12} /> Purge Unpinned Data
          </button>
      </div>

    </div>
  );
};