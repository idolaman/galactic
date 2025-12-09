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
}

export const useSessionStore = create<SessionState>((set, get) => {
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let mcpSession: { sessionId: string; protocolVersion: string } | null = null;

    // Track dismissed sessions in-memory only; allow re-appearance when the status changes.
    const dismissedSessions = new Map<string, string>();
    // Maintain stable ordering across status updates.
    const ordering = new Map<string, number>();
    let orderCounter = 0;

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

    const fetchSessions = async () => {
        const { serverUrl, token } = get();
        if (!serverUrl || !token) return;

        try {
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
            const deduped = dedupeByChatId(sessions);
            const filtered = deduped.filter((s) => !isDismissed(s));

            const ordered = filtered
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

            set({ sessions: ordered, loading: false, error: null, lastPoll: Date.now() });

        } catch (err) {
            console.error('Session polling failed', err);
            set({ error: err instanceof Error ? err.message : String(err) });
            // On fatal auth error or similar, maybe stop polling? For now just retry next tick.
        }
    };

    return {
        sessions: [],
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
                dismissedSessions.set(key, getSignature(targetSession));
            }

            // Update local state immediately to hide it
            set({
                sessions: currentSessions.filter((s) => s.id !== id)
            });
        }
    };
});
