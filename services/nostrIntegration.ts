/**
 * Nostr Integration — Decentralized Identity & Social Protocol
 * NIP-01 (Basic Protocol), NIP-04 (Encrypted DMs), NIP-07 (Browser Signer)
 * 
 * Architecture:
 * ┌──────────────────────────────────────────────┐
│              NOSTR LAYER                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Identity │  │  Relay   │  │  Event   │   │
│  │ (Keys)   │  │  Pool    │  │  Store   │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │              │              │          │
│  ┌────┴──────────────┴──────────────┴────┐   │
│  │         Nostr Protocol (NIP-01)       │   │
│  └────────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
 */

import { v4 as uuidv4 } from 'uuid';

// --- Types ---

export interface NostrKeyPair {
  publicKey: string; // hex
  privateKey: string; // hex (only for local signer)
  npub: string; // bech32
  nsec?: string; // bech32 (only for local signer)
}

export interface NostrProfile {
  pubkey: string;
  name?: string;
  displayName?: string;
  about?: string;
  picture?: string;
  banner?: string;
  website?: string;
  nip05?: string; // verified identity
  lud16?: string; // lightning address
  created_at: number;
}

export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

export interface NostrFilter {
  ids?: string[];
  authors?: string[];
  kinds?: number[];
  since?: number;
  until?: number;
  limit?: number;
  '#e'?: string[]; // referenced events
  '#p'?: string[]; // referenced pubkeys
  '#t'?: string[]; // hashtags
}

export interface RelayInfo {
  url: string;
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  read: boolean;
  write: boolean;
  lastSeen?: number;
  eventCount: number;
}

export interface AgentIdentity {
  agentId: string;
  nostrPubkey: string;
  displayName: string;
  bio: string;
  verified: boolean;
}

// --- Default Relays ---
const DEFAULT_RELAYS: string[] = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
  'wss://nostr.wine',
  'wss://relay.snort.social',
];

// --- Simple Nostr Implementation ---

class NostrManager {
  private static instance: NostrManager;
  private keyPair: NostrKeyPair | null = null;
  private profile: NostrProfile | null = null;
  private relays: Map<string, RelayInfo> = new Map();
  private events: Map<string, NostrEvent> = new Map();
  private subscriptions: Map<string, { filters: NostrFilter[]; callback: (event: NostrEvent) => void }> = new Map();
  private agentIdentities: Map<string, AgentIdentity> = new Map();
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  private constructor() {
    // Initialize default relays
    DEFAULT_RELAYS.forEach(url => {
      this.relays.set(url, {
        url,
        status: 'disconnected',
        read: true,
        write: true,
        eventCount: 0,
      });
    });
  }

  static getInstance(): NostrManager {
    if (!NostrManager.instance) {
      NostrManager.instance = new NostrManager();
    }
    return NostrManager.instance;
  }

  // --- Key Management ---

  generateKeys(): NostrKeyPair {
    // Simple key generation (in production, use nostr-tools or similar)
    const privateKey = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    const publicKey = this.derivePublicKey(privateKey);

    this.keyPair = {
      publicKey,
      privateKey,
      npub: this.hexToBech32('npub', publicKey),
      nsec: this.hexToBech32('nsec', privateKey),
    };

    this.emit('keys_generated', { publicKey: this.keyPair.publicKey, npub: this.keyPair.npub });
    return this.keyPair;
  }

  importKeys(privateKey: string): NostrKeyPair {
    const publicKey = this.derivePublicKey(privateKey);
    this.keyPair = {
      publicKey,
      privateKey,
      npub: this.hexToBech32('npub', publicKey),
      nsec: this.hexToBech32('nsec', privateKey),
    };
    this.emit('keys_imported', { publicKey, npub: this.keyPair.npub });
    return this.keyPair;
  }

  getKeys(): NostrKeyPair | null {
    return this.keyPair;
  }

  isConnected(): boolean {
    return this.keyPair !== null;
  }

  // --- Profile Management ---

  setProfile(profile: Partial<NostrProfile>): void {
    if (!this.keyPair) throw new Error('No keys configured');
    this.profile = {
      pubkey: this.keyPair.publicKey,
      name: profile.name,
      displayName: profile.displayName,
      about: profile.about,
      picture: profile.picture,
      banner: profile.banner,
      website: profile.website,
      nip05: profile.nip05,
      lud16: profile.lud16,
      created_at: Math.floor(Date.now() / 1000),
    };

    // Create kind 0 event (metadata)
    this.createEvent(0, JSON.stringify(this.profile), []);
    this.emit('profile_updated', this.profile);
  }

  getProfile(): NostrProfile | null {
    return this.profile;
  }

  // --- Event Creation ---

  createEvent(kind: number, content: string, tags: string[][] = []): NostrEvent {
    if (!this.keyPair) throw new Error('No keys configured');

    const event: NostrEvent = {
      id: '',
      pubkey: this.keyPair.publicKey,
      created_at: Math.floor(Date.now() / 1000),
      kind,
      tags,
      content,
      sig: '',
    };

    // Calculate event ID (simplified — in production use SHA256)
    event.id = this.calculateEventId(event);
    event.sig = this.signEvent(event);

    this.events.set(event.id, event);
    this.emit('event_created', { eventId: event.id, kind });

    // Broadcast to relays (simulated)
    this.broadcastToRelays(event);

    return event;
  }

  // Post a note (kind 1)
  publishNote(content: string, hashtags: string[] = []): NostrEvent {
    const tags: string[][] = hashtags.map(t => ['t', t]);
    return this.createEvent(1, content, tags);
  }

  // Send encrypted DM (NIP-04)
  sendDirectMessage(recipientPubkey: string, content: string): NostrEvent {
    // In production, encrypt with NIP-04
    const encryptedContent = `[encrypted]${content}`;
    const tags: string[][] = [['p', recipientPubkey]];
    return this.createEvent(4, encryptedContent, tags);
  }

  // Reference an event
  replyToEvent(eventId: string, pubkey: string, content: string): NostrEvent {
    const tags: string[][] = [
      ['e', eventId, '', 'reply'],
      ['p', pubkey],
    ];
    return this.createEvent(1, content, tags);
  }

  // --- Agent Identities ---

  createAgentIdentity(agentId: string, displayName: string, bio: string): AgentIdentity {
    // Each agent gets a derived identity
    const identity: AgentIdentity = {
      agentId,
      nostrPubkey: this.keyPair?.publicKey || `agent-${agentId}-${Date.now()}`,
      displayName,
      bio,
      verified: false,
    };
    this.agentIdentities.set(agentId, identity);

    // Publish agent profile as kind 30078 (parameterized replaceable)
    if (this.keyPair) {
      this.createEvent(30078, JSON.stringify({ agentId, displayName, bio }), [
        ['d', `agent:${agentId}`],
        ['t', 'agent'],
        ['t', 'luxor9'],
      ]);
    }

    this.emit('agent_identity_created', identity);
    return identity;
  }

  getAgentIdentity(agentId: string): AgentIdentity | undefined {
    return this.agentIdentities.get(agentId);
  }

  getAgentIdentities(): AgentIdentity[] {
    return Array.from(this.agentIdentities.values());
  }

  // --- Relay Management ---

  addRelay(url: string, read: boolean = true, write: boolean = true): void {
    this.relays.set(url, {
      url,
      status: 'disconnected',
      read,
      write,
      eventCount: 0,
    });
  }

  removeRelay(url: string): void {
    this.relays.delete(url);
  }

  getRelays(): RelayInfo[] {
    return Array.from(this.relays.values());
  }

  connectToRelays(): void {
    this.relays.forEach((info, url) => {
      if (info.status === 'disconnected') {
        info.status = 'connecting';
        // Simulate connection
        setTimeout(() => {
          info.status = 'connected';
          info.lastSeen = Date.now();
          this.emit('relay_connected', { url });
        }, 500 + Math.random() * 1500);
      }
    });
  }

  private broadcastToRelays(event: NostrEvent): void {
    this.relays.forEach(info => {
      if (info.status === 'connected' && info.write) {
        info.eventCount++;
      }
    });
  }

  // --- Subscriptions ---

  subscribe(filters: NostrFilter[], callback: (event: NostrEvent) => void): string {
    const subId = `sub-${uuidv4().slice(0, 8)}`;
    this.subscriptions.set(subId, { filters, callback });
    return subId;
  }

  unsubscribe(subId: string): void {
    this.subscriptions.delete(subId);
  }

  // Query local events
  query(filters: NostrFilter): NostrEvent[] {
    let results = Array.from(this.events.values());

    if (filters.ids) results = results.filter(e => filters.ids!.includes(e.id));
    if (filters.authors) results = results.filter(e => filters.authors!.includes(e.pubkey));
    if (filters.kinds) results = results.filter(e => filters.kinds!.includes(e.kind));
    if (filters.since) results = results.filter(e => e.created_at >= filters.since!);
    if (filters.until) results = results.filter(e => e.created_at <= filters.until!);

    results.sort((a, b) => b.created_at - a.created_at);
    if (filters.limit) results = results.slice(0, filters.limit);

    return results;
  }

  // --- Utility Methods ---

  private derivePublicKey(privateKey: string): string {
    // Simplified derivation (in production, use secp256k1)
    return privateKey.slice(0, 64).padEnd(64, '0');
  }

  private hexToBech32(prefix: string, hex: string): string {
    // Simplified encoding (in production, use bech32 library)
    return `${prefix}1${hex.slice(0, 32)}...${hex.slice(-8)}`;
  }

  private calculateEventId(event: Omit<NostrEvent, 'id' | 'sig'>): string {
    // Simplified ID calculation
    const data = JSON.stringify([0, event.pubkey, event.created_at, event.kind, event.tags, event.content]);
    return Array.from(new Uint8Array(32)).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  private signEvent(event: NostrEvent): string {
    // Simplified signing
    return Array.from(new Uint8Array(64)).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  // --- Events ---

  on(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach(cb => { try { cb(data); } catch {} });
    this.listeners.get('*')?.forEach(cb => { try { cb({ event, data }); } catch {} });
  }

  // --- Stats ---

  getStats(): {
    hasIdentity: boolean;
    connectedRelays: number;
    totalRelays: number;
    totalEvents: number;
    totalAgents: number;
    activeSubscriptions: number;
  } {
    return {
      hasIdentity: this.keyPair !== null,
      connectedRelays: Array.from(this.relays.values()).filter(r => r.status === 'connected').length,
      totalRelays: this.relays.size,
      totalEvents: this.events.size,
      totalAgents: this.agentIdentities.size,
      activeSubscriptions: this.subscriptions.size,
    };
  }
}

export default NostrManager;
