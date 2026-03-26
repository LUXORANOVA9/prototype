import { memoryService } from "./memoryService";

export type SystemEvent = {
  type: 'terminal' | 'file_edit' | 'clipboard' | 'action' | 'system';
  content: string;
  metadata?: Record<string, any>;
  timestamp: number;
};

class TelemetryService {
  private eventBuffer: SystemEvent[] = [];
  private readonly BUFFER_SIZE = 10;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds

  constructor() {
    if (typeof window !== 'undefined') {
      this.startFlushInterval();
    }
  }

  private startFlushInterval() {
    setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL);
  }

  /**
   * Capture a system event and buffer it for vectorization
   */
  public capture(event: Omit<SystemEvent, 'timestamp'>) {
    const fullEvent: SystemEvent = {
      ...event,
      timestamp: Date.now()
    };

    this.eventBuffer.push(fullEvent);

    // If buffer is full, flush immediately
    if (this.eventBuffer.length >= this.BUFFER_SIZE) {
      this.flush();
    }

    // Also dispatch a custom event for real-time UI updates if needed
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('luxor9_telemetry_event', { detail: fullEvent }));
    }
  }

  /**
   * Flush the buffer and vectorize events into the Neural Core
   */
  private async flush() {
    if (this.eventBuffer.length === 0) return;

    const eventsToProcess = [...this.eventBuffer];
    this.eventBuffer = [];

    for (const event of eventsToProcess) {
      // We don't want to vectorize every single character of terminal output
      // Maybe summarize or chunk if it's too large, but for now let's just add it
      const tag = `telemetry_${event.type}`;
      await memoryService.addMemory(
        `[${event.type.toUpperCase()}] ${event.content}`,
        'system',
        [tag, ...(event.metadata?.tags || [])]
      );
    }
  }

  /**
   * Get the most recent system state summary for context injection
   */
  public getRecentContext(limit = 5): string {
    // This could be more sophisticated, but for now just return the last few events
    // In a real app, we'd pull from memoryService.search or getRecent
    return ""; // Handled by memoryService directly in chat logic
  }
}

export const telemetryService = new TelemetryService();
