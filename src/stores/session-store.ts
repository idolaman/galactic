import { create } from "zustand";
import { buildOrderedSessions, getSessionKey, getSessionSignature } from "@/services/session-list";
import { readHookSessions } from "@/services/hook-sessions";
import type { SessionSummary } from "@/types/session";

interface SessionState {
  sessions: SessionSummary[];
  loading: boolean;
  error: string | null;
  polling: boolean;
  startPolling: () => void;
  stopPolling: () => void;
  ackSession: (id: string, runId: "run" | "done") => void;
  _receiveDismissal: (sessionId: string, signature: string) => void;
}

const dismissedSessions = new Map<string, string>();
const ordering = new Map<string, number>();
let orderCounter = 0;
let dismissedHydrationPromise: Promise<void> | null = null;
let cacheHydrationPromise: Promise<void> | null = null;

const initialDismissed = typeof window !== "undefined" ? window.electronAPI?.initialDismissedSessions : null;
initialDismissed?.forEach(([key, signature]) => dismissedSessions.set(key, signature));

const nextOrder = () => {
  orderCounter += 1;
  return orderCounter;
};

const initialCache = typeof window !== "undefined" ? window.electronAPI?.initialSessionCache : [];
const initialSessions = Array.isArray(initialCache)
  ? buildOrderedSessions(initialCache as SessionSummary[], dismissedSessions, ordering, nextOrder)
  : [];

const hydrateDismissedSessions = async () => {
  if (dismissedHydrationPromise) {
    return dismissedHydrationPromise;
  }

  dismissedHydrationPromise = (async () => {
    const entries = (await window.electronAPI?.getDismissedSessions?.()) ?? [];
    entries.forEach(([key, signature]) => dismissedSessions.set(key, signature));
    dismissedHydrationPromise = null;
  })();
  return dismissedHydrationPromise;
};

const hydrateCachedSessions = async (setSessions: (sessions: SessionSummary[]) => void) => {
  if (cacheHydrationPromise) {
    return cacheHydrationPromise;
  }

  cacheHydrationPromise = (async () => {
    await hydrateDismissedSessions();
    const cached = (await window.electronAPI?.getCachedSessions?.()) ?? [];
    const ordered = buildOrderedSessions(cached as SessionSummary[], dismissedSessions, ordering, nextOrder);
    if (ordered.length > 0) {
      setSessions(ordered);
    }
    cacheHydrationPromise = null;
  })();
  return cacheHydrationPromise;
};

export const useSessionStore = create<SessionState>((set, get) => {
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  const fetchSessions = async () => {
    try {
      await hydrateDismissedSessions();
      const ordered = buildOrderedSessions(await readHookSessions(), dismissedSessions, ordering, nextOrder);
      set({ sessions: ordered, loading: false, error: null });
      await window.electronAPI?.setCachedSessions?.(ordered);
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : String(error) });
    }
  };

  return {
    sessions: initialSessions,
    loading: false,
    error: null,
    polling: false,
    startPolling: () => {
      if (get().polling) {
        return;
      }

      set({ polling: true, loading: true });
      void hydrateCachedSessions((sessions) => set({ sessions }));
      void fetchSessions();
      pollTimer = setInterval(() => void fetchSessions(), 1500);
    },
    stopPolling: () => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
      set({ polling: false });
    },
    ackSession: (id) => {
      const target = get().sessions.find((session) => session.id === id);
      if (target) {
        const key = getSessionKey(target);
        const signature = getSessionSignature(target);
        dismissedSessions.set(key, signature);
        void window.electronAPI?.broadcastSessionDismiss?.(key, signature);
      }
      set({ sessions: get().sessions.filter((session) => session.id !== id) });
    },
    _receiveDismissal: (sessionId, signature) => {
      dismissedSessions.set(sessionId, signature);
      set({ sessions: get().sessions.filter((session) => getSessionKey(session) !== sessionId) });
    },
  };
});

if (typeof window !== "undefined" && window.electronAPI?.onSessionDismissed) {
  window.electronAPI.onSessionDismissed((sessionId, signature) => {
    useSessionStore.getState()._receiveDismissal(sessionId, signature);
  });
}
