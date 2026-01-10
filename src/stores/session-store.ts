import { create } from 'zustand';
import { initialize, readClientSessions, SessionSummary } from '../services/session-rpc';

interface SessionState {
    sessions: SessionSummary[];
    loading: boolean;
    error: string | null;
    serverUrl: string;
    token: string | null;
    polling: boolean;
    lastPoll: number;

    setCredentials: (url: string, token: string) => void;
    startPolling: () => void;
    stopPolling: () => void;
    ackSession: (id: string, runId: "run" | "done") => void;
    // Internal method for receiving dismissals from other windows
    _receiveDismissal: (sessionId: string, signature: string) => void;
}

export const useSessionStore = create<SessionState>((set, get) => {
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let mcpSession: { sessionId: string; protocolVersion: string } | null = null;

    // Track dismissed sessions in-memory; hydrate from main so new windows inherit dismissals.
    const dismissedSessions = new Map<string, string>();
    let dismissedHydrated = false;
    let dismissedHydrationPromise: Promise<void> | null = null;
    let cacheHydrated = false;
    let cacheHydrationPromise: Promise<void> | null = null;
    // Maintain stable ordering across status updates.
    const ordering = new Map<string, number>();
    let orderCounter = 0;
    const initialDismissed = typeof window !== 'undefined'
        ? window.electronAPI?.initialDismissedSessions
        : null;

    if (Array.isArray(initialDismissed)) {
        for (const entry of initialDismissed) {
            if (!Array.isArray(entry) || entry.length < 2) {
                continue;
            }
            const [key, signature] = entry;
            if (typeof key === 'string' && typeof signature === 'string') {
                dismissedSessions.set(key, signature);
            }
        }
        dismissedHydrated = true;
    }

    const getTimestamp = (session: SessionSummary) => {
        const ts = new Date(session.ended_at || session.started_at || 0).getTime();
        return Number.isNaN(ts) ? 0 : ts;
    };

    const getKey = (session: SessionSummary) => session.chat_id || session.id;

    const getSignature = (session: SessionSummary) =>
        `${session.id}:${session.status}:${session.started_at ?? ""}:${session.ended_at ?? ""}`;

    const isDismissed = (session: SessionSummary) => {
        const key = getKey(session);
        const currentSignature = getSignature(session);
        const storedSignature = dismissedSessions.get(key);

        if (!storedSignature) return false;
        if (storedSignature === currentSignature) return true;

        // Status changed; remove stale dismissal so updates show again.
        dismissedSessions.delete(key);
        return false;
    };

    const dedupeByChatId = (list: SessionSummary[]) => {
        const latestByChat = new Map<string, SessionSummary>();
        const withoutChat: SessionSummary[] = [];

        for (const session of list) {
            if (!session.chat_id) {
                withoutChat.push(session);
                continue;
            }

            const existing = latestByChat.get(session.chat_id);
            if (!existing) {
                latestByChat.set(session.chat_id, session);
                continue;
            }

            const existingTs = getTimestamp(existing);
            const currentTs = getTimestamp(session);
            latestByChat.set(session.chat_id, currentTs >= existingTs ? session : existing);
        }

        return [...withoutChat, ...latestByChat.values()];
    };

    const buildOrderedSessions = (list: SessionSummary[]) => {
        const deduped = dedupeByChatId(list);
        const filtered = deduped.filter((s) => !isDismissed(s));

        return filtered
            .map((session) => {
                const key = getKey(session);
                const existingOrder = ordering.get(key);
                if (existingOrder === undefined) {
                    orderCounter += 1;
                    ordering.set(key, orderCounter);
                }
                return { session, order: ordering.get(key)! };
            })
            .sort((a, b) => a.order - b.order)
            .map((entry) => entry.session);
    };

    const initialCache = typeof window !== 'undefined'
        ? window.electronAPI?.initialSessionCache
        : null;
    const initialSessions = Array.isArray(initialCache) && initialCache.length > 0
        ? buildOrderedSessions(initialCache as SessionSummary[])
        : [];

    if (initialSessions.length > 0) {
        cacheHydrated = true;
    }

    const hydrateDismissedSessions = async () => {
        if (dismissedHydrated) {
            return;
        }
        if (dismissedHydrationPromise) {
            return dismissedHydrationPromise;
        }

        dismissedHydrationPromise = (async () => {
            if (typeof window === 'undefined' || !window.electronAPI?.getDismissedSessions) {
                dismissedHydrated = true;
                return;
            }

            try {
                const entries = await window.electronAPI.getDismissedSessions();
                if (Array.isArray(entries)) {
                    for (const entry of entries) {
                        if (!Array.isArray(entry) || entry.length < 2) {
                            continue;
                        }
                        const [key, signature] = entry;
                        if (typeof key === 'string' && typeof signature === 'string') {
                            dismissedSessions.set(key, signature);
                        }
                    }
                }
            } catch (err) {
                console.warn('Failed to hydrate dismissed sessions', err);
            } finally {
                dismissedHydrated = true;
                dismissedHydrationPromise = null;
            }
        })();

        return dismissedHydrationPromise;
    };

    const hydrateCachedSessions = async () => {
        if (cacheHydrated) {
            return;
        }
        if (cacheHydrationPromise) {
            return cacheHydrationPromise;
        }

        cacheHydrationPromise = (async () => {
            if (typeof window === 'undefined' || !window.electronAPI?.getCachedSessions) {
                cacheHydrated = true;
                return;
            }

            try {
                await hydrateDismissedSessions();
                const cached = await window.electronAPI.getCachedSessions();
                if (Array.isArray(cached) && cached.length > 0) {
                    const ordered = buildOrderedSessions(cached as SessionSummary[]);
                    if (ordered.length > 0) {
                        set({ sessions: ordered });
                    }
                }
            } catch (err) {
                console.warn('Failed to hydrate cached sessions', err);
            } finally {
                cacheHydrated = true;
                cacheHydrationPromise = null;
            }
        })();

        return cacheHydrationPromise;
    };

    const fetchSessions = async () => {
        const { serverUrl, token } = get();
        if (!serverUrl || !token) return;

        try {
            await hydrateDismissedSessions();
            // Initialize if needed
            if (!mcpSession) {
                mcpSession = await initialize({ baseUrl: serverUrl, token });
            }

            const sessions = await readClientSessions({
                baseUrl: serverUrl,
                token,
                sessionId: mcpSession.sessionId,
                protocolVersion: mcpSession.protocolVersion
            });

            // Keep only the latest session per chat_id, then filter out dismissed ones and maintain stable order.
            const ordered = buildOrderedSessions(sessions);

            set({ sessions: ordered, loading: false, error: null, lastPoll: Date.now() });
            if (typeof window !== 'undefined') {
                void window.electronAPI?.setCachedSessions?.(ordered);
            }

        } catch (err) {
            console.error('Session polling failed', err);
            set({ error: err instanceof Error ? err.message : String(err) });
            // On fatal auth error or similar, maybe stop polling? For now just retry next tick.
        }
    };

    return {
        sessions: initialSessions,
        loading: false,
        error: null,
        serverUrl: 'http://localhost:17890',
        token: 'dev',
        polling: false,
        lastPoll: 0,

        setCredentials: (url, token) => {
            set({ serverUrl: url, token });
            // If already polling, restart to apply new creds?
            if (get().polling) {
                get().stopPolling();
                get().startPolling();
            }
        },

        startPolling: () => {
            if (get().polling) return;
            set({ polling: true, loading: true });

            void hydrateCachedSessions();
            // Immediate fetch
            void fetchSessions();

            pollTimer = setInterval(fetchSessions, 1500);
        },

        stopPolling: () => {
            if (pollTimer) {
                clearInterval(pollTimer);
                pollTimer = null;
            }
            set({ polling: false });
        },

        ackSession: (id, _runId) => {
            const currentSessions = get().sessions;
            const targetSession = currentSessions.find((s) => s.id === id);
            if (targetSession) {
                const key = getKey(targetSession);
                const signature = getSignature(targetSession);
                dismissedSessions.set(key, signature);

                // Broadcast to other windows via IPC
                window.electronAPI?.broadcastSessionDismiss?.(key, signature);
            }

            // Update local state immediately to hide it
            set({
                sessions: currentSessions.filter((s) => s.id !== id)
            });
        },

        _receiveDismissal: (sessionId, signature) => {
            // Add to dismissed sessions map
            dismissedSessions.set(sessionId, signature);

            // Remove from current sessions if present
            const currentSessions = get().sessions;
            const filtered = currentSessions.filter((s) => getKey(s) !== sessionId);
            if (filtered.length !== currentSessions.length) {
                set({ sessions: filtered });
            }
        }
    };
});

// Set up IPC listener for session dismissals from other windows
if (typeof window !== 'undefined' && window.electronAPI?.onSessionDismissed) {
    window.electronAPI.onSessionDismissed((sessionId, signature) => {
        useSessionStore.getState()._receiveDismissal(sessionId, signature);
    });
}
