type EventPayload = { name: string; ts: number; meta?: Record<string, any> };
const STORAGE_KEY = 'luxor9_analytics_v1';

function persist(ev: EventPayload) {
  try {
    const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    arr.push(ev);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch (e) {
    // ignore
  }
}

export function mark(name: string) {
  persist({ name, ts: Date.now() });
}

export function trackEvent(name: string, meta?: Record<string, any>) {
  persist({ name, ts: Date.now(), meta });
}

export async function flushAnalytics(endpoint: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const payload = JSON.parse(raw);
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: payload }),
    });
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // keep local if network failed
  }
}
