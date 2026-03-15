import type { SessionSummary } from "./session-rpc";

interface ClaudeHookSnapshot {
  installed: boolean;
  sessions: SessionSummary[];
}

export async function readClaudeHookSessions(): Promise<ClaudeHookSnapshot> {
  if (typeof window === "undefined" || !window.electronAPI?.getClaudeHookSessions) {
    return { installed: false, sessions: [] };
  }

  try {
    const snapshot = await window.electronAPI.getClaudeHookSessions();
    const sessions = Array.isArray(snapshot?.sessions) ? snapshot.sessions as SessionSummary[] : [];
    return { installed: Boolean(snapshot?.installed), sessions };
  } catch (error) {
    console.warn("Failed to read Claude hook sessions", error);
    return { installed: false, sessions: [] };
  }
}
