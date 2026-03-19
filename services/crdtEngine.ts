/**
 * CRDT Service — Conflict-free Replicated Data Types
 * Real-time collaborative editing using Yjs-like CRDTs
 * 
 * Architecture:
 * ┌─────────────────────────────────────────────┐
 * │              CRDT ENGINE                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Document │  │ Awareness│  │ Provider │  │
│  │ (Y.Doc)  │  │ (Peers)  │  │ (Sync)   │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │              │              │        │
│  ┌────┴──────────────┴──────────────┴────┐  │
│  │        WebSocket Transport             │  │
│  └────────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
 */

import { v4 as uuidv4 } from 'uuid';

// --- Types ---

export interface CRDTDoc {
  id: string;
  type: 'text' | 'array' | 'map' | 'canvas';
  content: any;
  version: number;
  clock: number;
  clientId: number;
  updatedAt: number;
}

export interface CRDTOperation {
  id: string;
  docId: string;
  type: 'insert' | 'delete' | 'set' | 'move';
  path: string[];
  value?: any;
  position?: number;
  length?: number;
  clientId: number;
  clock: number;
  timestamp: number;
}

export interface AwarenessState {
  clientId: number;
  user: { name: string; color: string; avatar?: string };
  cursor?: { anchor: number; head: number };
  selection?: { start: number; end: number };
  lastSeen: number;
}

export interface CollaborationSession {
  docId: string;
  participants: AwarenessState[];
  operations: CRDTOperation[];
  createdAt: number;
}

// --- Simple CRDT Implementation ---

class LWWRegister<T> {
  private value: T;
  private clock: number;
  private clientId: number;

  constructor(initial: T, clientId: number) {
    this.value = initial;
    this.clock = 0;
    this.clientId = clientId;
  }

  set(value: T): CRDTOperation {
    this.clock++;
    this.value = value;
    return {
      id: uuidv4(),
      docId: '',
      type: 'set',
      path: [],
      value,
      clientId: this.clientId,
      clock: this.clock,
      timestamp: Date.now(),
    };
  }

  get(): T {
    return this.value;
  }

  merge(op: CRDTOperation): void {
    if (op.clock > this.clock || (op.clock === this.clock && op.clientId > this.clientId)) {
      this.value = op.value;
      this.clock = op.clock;
    }
  }
}

class GArray<T> {
  private elements: Array<{ value: T; id: string; clock: number; clientId: number; deleted: boolean }> = [];
  private clientId: number;
  private clock: number = 0;

  constructor(clientId: number) {
    this.clientId = clientId;
  }

  insert(index: number, value: T): CRDTOperation {
    this.clock++;
    const id = uuidv4();
    const elem = { value, id, clock: this.clock, clientId: this.clientId, deleted: false };
    this.elements.splice(index, 0, elem);
    return {
      id: uuidv4(),
      docId: '',
      type: 'insert',
      path: [],
      value,
      position: index,
      clientId: this.clientId,
      clock: this.clock,
      timestamp: Date.now(),
    };
  }

  delete(index: number): CRDTOperation {
    this.clock++;
    if (this.elements[index]) {
      this.elements[index].deleted = true;
    }
    return {
      id: uuidv4(),
      docId: '',
      type: 'delete',
      path: [],
      position: index,
      length: 1,
      clientId: this.clientId,
      clock: this.clock,
      timestamp: Date.now(),
    };
  }

  getContent(): T[] {
    return this.elements.filter(e => !e.deleted).map(e => e.value);
  }

  length(): number {
    return this.elements.filter(e => !e.deleted).length;
  }

  merge(op: CRDTOperation): void {
    if (op.type === 'insert' && op.position !== undefined && op.value !== undefined) {
      const existing = this.elements.find(e => e.clock === op.clock && e.clientId === op.clientId);
      if (!existing) {
        this.elements.splice(op.position, 0, {
          value: op.value,
          id: op.id,
          clock: op.clock,
          clientId: op.clientId,
          deleted: false,
        });
      }
    }
    if (op.type === 'delete' && op.position !== undefined) {
      const visible = this.elements.filter(e => !e.deleted);
      if (visible[op.position]) {
        visible[op.position].deleted = true;
      }
    }
  }
}

// --- CRDT Document ---

export class CRDTDocument {
  id: string;
  type: CRDTDoc['type'];
  private registers: Map<string, LWWRegister<any>> = new Map();
  private arrays: Map<string, GArray<any>> = new Map();
  private operations: CRDTOperation[] = [];
  private clientId: number;
  private version: number = 0;
  private listeners: Set<(op: CRDTOperation) => void> = new Set();

  constructor(id: string, type: CRDTDoc['type'], clientId?: number) {
    this.id = id;
    this.type = type;
    this.clientId = clientId || Math.floor(Math.random() * 1000000);
  }

  // Text operations
  insertText(key: string, position: number, text: string): CRDTOperation {
    if (!this.arrays.has(key)) this.arrays.set(key, new GArray(this.clientId));
    const arr = this.arrays.get(key)!;
    const op = arr.insert(position, text);
    op.docId = this.id;
    this.version++;
    this.operations.push(op);
    this.notify(op);
    return op;
  }

  deleteText(key: string, position: number, length: number = 1): CRDTOperation[] {
    const ops: CRDTOperation[] = [];
    const arr = this.arrays.get(key);
    if (!arr) return ops;
    for (let i = 0; i < length; i++) {
      const op = arr.delete(position);
      op.docId = this.id;
      this.version++;
      this.operations.push(op);
      ops.push(op);
      this.notify(op);
    }
    return ops;
  }

  getText(key: string): string {
    const arr = this.arrays.get(key);
    if (!arr) return '';
    return arr.getContent().join('');
  }

  // Map operations
  set(key: string, value: any): CRDTOperation {
    if (!this.registers.has(key)) this.registers.set(key, new LWWRegister(value, this.clientId));
    const reg = this.registers.get(key)!;
    const op = reg.set(value);
    op.docId = this.id;
    this.version++;
    this.operations.push(op);
    this.notify(op);
    return op;
  }

  get(key: string): any {
    const reg = this.registers.get(key);
    return reg?.get();
  }

  // Canvas operations (for collaborative drawing)
  addObject(key: string, obj: any): CRDTOperation {
    if (!this.arrays.has(key)) this.arrays.set(key, new GArray(this.clientId));
    const arr = this.arrays.get(key)!;
    const op = arr.insert(arr.length(), obj);
    op.docId = this.id;
    op.type = 'set';
    this.version++;
    this.operations.push(op);
    this.notify(op);
    return op;
  }

  getObjects(key: string): any[] {
    const arr = this.arrays.get(key);
    return arr?.getContent() || [];
  }

  // Merge remote operation
  applyOperation(op: CRDTOperation): void {
    if (op.type === 'set') {
      if (!this.registers.has(op.path[0] || '')) {
        this.registers.set(op.path[0] || '', new LWWRegister(op.value, op.clientId));
      }
      this.registers.get(op.path[0] || '')?.merge(op);
    } else if (op.type === 'insert' || op.type === 'delete') {
      const key = op.path[0] || 'default';
      if (!this.arrays.has(key)) this.arrays.set(key, new GArray(op.clientId));
      this.arrays.get(key)?.merge(op);
    }
    this.version++;
    this.notify(op);
  }

  // Event listeners
  onUpdate(callback: (op: CRDTOperation) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify(op: CRDTOperation): void {
    this.listeners.forEach(cb => { try { cb(op); } catch {} });
  }

  getState(): CRDTDoc {
    const content: any = {};
    this.registers.forEach((reg, key) => { content[key] = reg.get(); });
    this.arrays.forEach((arr, key) => { content[key] = arr.getContent(); });
    return {
      id: this.id,
      type: this.type,
      content,
      version: this.version,
      clock: 0,
      clientId: this.clientId,
      updatedAt: Date.now(),
    };
  }

  getOperations(): CRDTOperation[] {
    return [...this.operations];
  }

  getVersion(): number {
    return this.version;
  }

  getClientId(): number {
    return this.clientId;
  }
}

// --- CRDT Manager (Singleton) ---

class CRDTManager {
  private static instance: CRDTManager;
  private documents: Map<string, CRDTDocument> = new Map();
  private sessions: Map<string, CollaborationSession> = new Map();
  private clientId: number = Math.floor(Math.random() * 1000000);
  private wsConnections: Map<string, WebSocket> = new Map();
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  static getInstance(): CRDTManager {
    if (!CRDTManager.instance) {
      CRDTManager.instance = new CRDTManager();
    }
    return CRDTManager.instance;
  }

  getOrCreateDocument(docId: string, type: CRDTDoc['type']): CRDTDocument {
    if (!this.documents.has(docId)) {
      const doc = new CRDTDocument(docId, type, this.clientId);
      this.documents.set(docId, doc);

      // Create collaboration session
      this.sessions.set(docId, {
        docId,
        participants: [],
        operations: [],
        createdAt: Date.now(),
      });
    }
    return this.documents.get(docId)!;
  }

  getDocument(docId: string): CRDTDocument | undefined {
    return this.documents.get(docId);
  }

  getSession(docId: string): CollaborationSession | undefined {
    return this.sessions.get(docId);
  }

  // Awareness (cursors, selections)
  updateAwareness(docId: string, state: Partial<AwarenessState>): void {
    const session = this.sessions.get(docId);
    if (!session) return;

    const existing = session.participants.find(p => p.clientId === this.clientId);
    if (existing) {
      Object.assign(existing, state, { lastSeen: Date.now() });
    } else {
      session.participants.push({
        clientId: this.clientId,
        user: state.user || { name: 'Anonymous', color: '#f59e0b' },
        ...state,
        lastSeen: Date.now(),
      });
    }

    // Clean up stale participants
    const now = Date.now();
    session.participants = session.participants.filter(p => now - p.lastSeen < 30000);
  }

  getParticipants(docId: string): AwarenessState[] {
    return this.sessions.get(docId)?.participants || [];
  }

  // Sync operations
  sync(docId: string, sinceVersion: number = 0): CRDTOperation[] {
    const doc = this.documents.get(docId);
    if (!doc) return [];
    return doc.getOperations().filter(op => op.clock > sinceVersion);
  }

  // Broadcast operation
  broadcast(docId: string, op: CRDTOperation): void {
    const session = this.sessions.get(docId);
    if (session) {
      session.operations.push(op);
    }
    this.emit(`crdt:${docId}`, op);
  }

  // WebSocket connection
  connect(docId: string, wsUrl: string): WebSocket | null {
    try {
      const ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'join', docId, clientId: this.clientId }));
      };
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'operation') {
            const doc = this.documents.get(docId);
            doc?.applyOperation(msg.operation);
          }
          if (msg.type === 'awareness') {
            this.updateAwareness(docId, msg.state);
          }
        } catch {}
      };
      this.wsConnections.set(docId, ws);
      return ws;
    } catch {
      return null;
    }
  }

  disconnect(docId: string): void {
    const ws = this.wsConnections.get(docId);
    if (ws) {
      ws.close();
      this.wsConnections.delete(docId);
    }
  }

  // Events
  on(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach(cb => { try { cb(data); } catch {} });
    this.listeners.get('*')?.forEach(cb => { try { cb({ event, data }); } catch {} });
  }

  // Stats
  getStats(): { documents: number; sessions: number; totalOperations: number } {
    let totalOps = 0;
    this.documents.forEach(doc => { totalOps += doc.getOperations().length; });
    return {
      documents: this.documents.size,
      sessions: this.sessions.size,
      totalOperations: totalOps,
    };
  }
}

export default CRDTManager;
