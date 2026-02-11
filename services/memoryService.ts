import { MemoryNode } from "../types";
import { getEmbedding } from "./geminiService";

const STORAGE_KEY = 'luxor9_neural_core_v1';
const MAX_MEMORIES = 200; // Prevent localStorage overflow

class MemoryService {
  private memories: MemoryNode[] = [];
  private isInitialized = false;

  constructor() {
    this.loadMemories();
  }

  private loadMemories() {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.memories = JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to load Neural Core memory", e);
      this.memories = [];
    }
    this.isInitialized = true;
  }

  private saveMemories() {
    if (typeof window === 'undefined') return;
    try {
        // Enforce limit (FIFO), but PROTECT pinned memories
        if (this.memories.length > MAX_MEMORIES) {
            const pinned = this.memories.filter(m => m.isPinned);
            let unpinned = this.memories.filter(m => !m.isPinned);
            
            // Sort unpinned by timestamp desc
            unpinned.sort((a, b) => b.timestamp - a.timestamp);
            
            // Trim unpinned to make space
            const spaceForUnpinned = Math.max(0, MAX_MEMORIES - pinned.length);
            unpinned = unpinned.slice(0, spaceForUnpinned);
            
            // Recombine
            this.memories = [...pinned, ...unpinned];
            
            // Final Sort for consistency
            this.memories.sort((a, b) => b.timestamp - a.timestamp);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.memories));
    } catch (e) {
        console.error("Failed to save Neural Core memory", e);
    }
  }

  /**
   * Calculate Cosine Similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let magA = 0;
    let magB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        magA += vecA[i] * vecA[i];
        magB += vecB[i] * vecB[i];
    }
    const magnitude = Math.sqrt(magA) * Math.sqrt(magB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * Add a new memory to the core.
   * Generates embedding via Gemini API automatically.
   */
  public async addMemory(content: string, type: MemoryNode['type'] = 'interaction', tags: string[] = []): Promise<MemoryNode | null> {
    try {
        const embedding = await getEmbedding(content);
        if (!embedding) return null;

        const newNode: MemoryNode = {
            id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            content,
            embedding,
            timestamp: Date.now(),
            type,
            tags,
            relevance: 0,
            isPinned: false
        };

        this.memories.unshift(newNode);
        this.saveMemories();
        return newNode;
    } catch (e) {
        console.error("Memory assimilation failed", e);
        return null;
    }
  }

  /**
   * Toggle Pin status for persistent context injection
   */
  public togglePin(id: string) {
      const mem = this.memories.find(m => m.id === id);
      if (mem) {
          mem.isPinned = !mem.isPinned;
          this.saveMemories();
      }
  }

  public getPinned(): MemoryNode[] {
      return this.memories.filter(m => m.isPinned);
  }

  /**
   * Search for memories relevant to a query.
   * Returns top K matches.
   */
  public async search(query: string, limit = 5, minSimilarity = 0.6): Promise<MemoryNode[]> {
      if (this.memories.length === 0) return [];
      
      try {
          const queryEmbedding = await getEmbedding(query);
          if (!queryEmbedding) return [];

          const scored = this.memories.map(mem => ({
              ...mem,
              relevance: this.cosineSimilarity(queryEmbedding, mem.embedding)
          }));

          // Sort by relevance descending
          const results = scored
            .filter(mem => mem.relevance >= minSimilarity)
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, limit);

          return results;
      } catch (e) {
          console.error("Memory retrieval error", e);
          return [];
      }
  }

  public getRecent(limit = 10): MemoryNode[] {
      return [...this.memories]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
  }

  public deleteMemory(id: string) {
      this.memories = this.memories.filter(m => m.id !== id);
      this.saveMemories();
  }

  public clear() {
      // Keep pinned memories even on clear? Maybe. But "Purge" usually implies full wipe.
      // Let's do full wipe for safety/reset.
      this.memories = [];
      localStorage.removeItem(STORAGE_KEY);
  }
}

export const memoryService = new MemoryService();