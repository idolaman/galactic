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

// Persist acknowledged sessions in localStorage
const STORAGE_KEY_ACK = 'galactic-ide:acked-sessions';
const loadAcked = (): Set<string> => {
    try {
        return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY_ACK) || '[]'));
    } catch {
        return new Set();
    }
};
const saveAcked = (acked: Set<string>) => {
    localStorage.setItem(STORAGE_KEY_ACK, JSON.stringify(Array.from(acked)));
};

export const useSessionStore = create<SessionState>((set, get) => {
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let mcpSession: { sessionId: string; protocolVersion: string } | null = null;

    const ackedSessions = loadAcked();

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

            // Filter out acknowledged sessions
            // Key: id + suffix
            const filtered = sessions.filter(s => {
                const keyRun = `${s.id}:run`;
                const keyDone = `${s.id}:done`;

                if (s.status === 'done') {
                    // If done, hide if 'done' is acked.
                    // If 'run' was acked but now it is done, we SHOW it again (as finished) until user acks the finish state.
                    if (ackedSessions.has(keyDone)) return false;
                } else {
                    // In progress
                    if (ackedSessions.has(keyRun)) return false;
                }
                return true;
            });
            set({ sessions: filtered, loading: false, error: null, lastPoll: Date.now() });

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

        ackSession: (id, runId) => {
            const key = `${id}:${runId}`;
            ackedSessions.add(key);
            saveAcked(ackedSessions);

            // Update local state immediately to hide it
            const currentSessions = get().sessions;
            set({
                sessions: currentSessions.filter(s => {
                    if (s.id !== id) return true;
                    // If we are acking strictly the state it is in:
                    if (s.status === 'done' && runId === 'done') return false;
                    if (s.status === 'in_progress' && runId === 'run') return false;
                    return true;
                })
            });
        }
    };
});
