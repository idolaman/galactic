export const MAX_VISIBLE_WORKSPACE_SESSIONS = 3;
const WINDOWS_DRIVE_PATH_PATTERN = /^[A-Za-z]:[\\/]/;
const WINDOWS_UNC_PATH_PATTERN = /^\\\\/;

export interface WorkspaceSession {
  id: string;
  started_at?: string;
  ended_at?: string;
  workspace_path?: string;
  chat_id?: string;
}

interface SessionEntry<T extends WorkspaceSession> {
  index: number;
  session: T;
}

const getSessionTimestamp = (session: WorkspaceSession): number => {
  const timestamp = new Date(session.ended_at ?? session.started_at ?? 0).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const isNewerEntry = <T extends WorkspaceSession>(
  candidate: SessionEntry<T>,
  current: SessionEntry<T>,
): boolean => {
  const timestampDiff =
    getSessionTimestamp(candidate.session) - getSessionTimestamp(current.session);

  if (timestampDiff !== 0) {
    return timestampDiff > 0;
  }

  return candidate.index > current.index;
};

const toVisibleEntries = <T extends WorkspaceSession>(
  entries: SessionEntry<T>[],
): SessionEntry<T>[] => {
  const latestByChatId = new Map<string, SessionEntry<T>>();
  const sessionsWithoutChatId: SessionEntry<T>[] = [];

  for (const entry of entries) {
    if (!entry.session.chat_id) {
      sessionsWithoutChatId.push(entry);
      continue;
    }

    const existing = latestByChatId.get(entry.session.chat_id);
    if (!existing || isNewerEntry(entry, existing)) {
      latestByChatId.set(entry.session.chat_id, entry);
    }
  }

  const dedupedEntries = [...sessionsWithoutChatId, ...latestByChatId.values()];
  const newestEntries = [...dedupedEntries]
    .sort((left, right) => {
      const timestampDiff =
        getSessionTimestamp(right.session) - getSessionTimestamp(left.session);

      if (timestampDiff !== 0) {
        return timestampDiff;
      }

      return right.index - left.index;
    })
    .slice(0, MAX_VISIBLE_WORKSPACE_SESSIONS);
  const visibleIndexes = new Set(newestEntries.map((entry) => entry.index));

  return dedupedEntries
    .filter((entry) => visibleIndexes.has(entry.index))
    .sort((left, right) => left.index - right.index);
};

export const normalizeWorkspacePath = (path: string): string => {
  const normalized = path.replace(/[\\/]+$/, "");
  const isWindowsPath =
    normalized.includes("\\") ||
    WINDOWS_DRIVE_PATH_PATTERN.test(normalized) ||
    WINDOWS_UNC_PATH_PATTERN.test(normalized);

  return isWindowsPath ? normalized.toLowerCase() : normalized;
};

export const buildVisibleWorkspaceSessionMap = <T extends WorkspaceSession>(
  sessions: T[],
): Map<string, T[]> => {
  const sessionsByPath = new Map<string, SessionEntry<T>[]>();

  sessions.forEach((session, index) => {
    if (!session.workspace_path) {
      return;
    }

    const path = normalizeWorkspacePath(session.workspace_path);
    const entries = sessionsByPath.get(path) ?? [];

    entries.push({ index, session });
    sessionsByPath.set(path, entries);
  });

  return new Map(
    Array.from(sessionsByPath.entries()).map(([path, entries]) => [
      path,
      toVisibleEntries(entries).map((entry) => entry.session),
    ]),
  );
};
