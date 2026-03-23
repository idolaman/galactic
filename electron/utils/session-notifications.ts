import path from "node:path";

export interface SessionNotificationSession {
  id: string;
  title: string;
  status: "in_progress" | "done";
  platform?: string;
  project?: string;
  gitBranch?: string;
  workspacePath?: string;
  startedAt?: string;
  endedAt?: string;
}

export interface FinishedSessionNotification {
  actionText?: string;
  body: string;
  signature: string;
  subtitle?: string;
  title: string;
  workspacePath?: string;
}

interface FinishedSessionNotificationParams {
  allowNewDoneSessions: boolean;
  hotkeyEnabled: boolean;
  nextSessions: unknown[];
  preferredEditor?: string;
  notifiedSignatures: ReadonlySet<string>;
  previousSessions: unknown[];
}

const PLATFORM_LABELS: Record<string, string> = {
  chatgpt: "Codex",
  claude: "Claude",
  codex: "Codex",
  cursor: "Cursor",
  github: "GitHub",
  vscode: "VS Code",
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toOptionalString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;

const truncateEnd = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
};

const truncateMiddle = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) {
    return value;
  }

  const available = maxLength - 3;
  const left = Math.ceil(available / 2);
  const right = Math.floor(available / 2);
  return `${value.slice(0, left)}...${value.slice(value.length - right)}`;
};

const toSessionStatus = (value: unknown, endedAt?: string): "in_progress" | "done" | null => {
  if (value === "in_progress" || value === "done") {
    return value;
  }

  return endedAt ? "done" : null;
};

const formatPlatformLabel = (platform?: string): string => {
  if (!platform) {
    return "Coding agent";
  }

  const normalized = platform.trim().toLowerCase();
  if (!normalized) {
    return "Coding agent";
  }

  const knownLabel = PLATFORM_LABELS[normalized];
  if (knownLabel) {
    return knownLabel;
  }

  return normalized
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const formatSubtitle = (session: SessionNotificationSession): string | undefined => {
  return truncateEnd(session.title.trim() || "Untitled task", 72);
};

const formatDuration = (session: SessionNotificationSession): string | undefined => {
  if (!session.startedAt || !session.endedAt) {
    return undefined;
  }

  const startedAt = new Date(session.startedAt).getTime();
  const endedAt = new Date(session.endedAt).getTime();
  if (Number.isNaN(startedAt) || Number.isNaN(endedAt) || endedAt <= startedAt) {
    return undefined;
  }

  const totalSeconds = Math.round((endedAt - startedAt) / 1000);
  if (totalSeconds < 60) {
    return `${Math.max(1, totalSeconds)}s`;
  }

  const totalMinutes = Math.round(totalSeconds / 60);
  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours < 24) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
};

const formatContext = (
  session: SessionNotificationSession,
  hotkeyEnabled: boolean,
): string => {
  const workspaceLabel = session.workspacePath ? path.basename(session.workspacePath) : undefined;
  const parts = [
    session.project ? truncateMiddle(session.project, 24) : workspaceLabel ? truncateMiddle(workspaceLabel, 24) : undefined,
    session.gitBranch ? truncateMiddle(session.gitBranch, 28) : undefined,
    formatDuration(session),
  ].filter((value): value is string => Boolean(value));

  if (session.workspacePath) {
    return parts.length > 0 ? parts.join(" | ") : "Open the finished workspace.";
  }

  if (parts.length === 0) {
    return hotkeyEnabled
      ? "Cmd+Shift+G for full session details."
      : "Open Galactic for full session details.";
  }

  return hotkeyEnabled ? `${parts.join(" | ")} | Cmd+Shift+G` : parts.join(" | ");
};

const formatActionText = (preferredEditor?: string): string => {
  if (preferredEditor === "VSCode") {
    return "Open in VS Code";
  }

  if (preferredEditor === "Cursor") {
    return "Open in Cursor";
  }

  return "Open workspace";
};

const normalizeSession = (value: unknown): SessionNotificationSession | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = toOptionalString(value.id);
  const endedAt = toOptionalString(value.ended_at);
  const status = toSessionStatus(value.status, endedAt);
  if (!id || !status) {
    return null;
  }

  return {
    id,
    title: toOptionalString(value.title) ?? "Untitled task",
    status,
    platform: toOptionalString(value.platform),
    project: toOptionalString(value.project),
    gitBranch: toOptionalString(value.git_branch),
    workspacePath: toOptionalString(value.workspace_path),
    startedAt: toOptionalString(value.started_at),
    endedAt,
  };
};

const parseSessions = (sessions: unknown[]): SessionNotificationSession[] =>
  sessions.map(normalizeSession).filter((session): session is SessionNotificationSession => session !== null);

export const getFinishedSessionSignature = (session: SessionNotificationSession): string =>
  `${session.id}:${session.status}:${session.startedAt ?? ""}:${session.endedAt ?? ""}`;

export const buildFinishedSessionNotification = (
  session: SessionNotificationSession,
  hotkeyEnabled: boolean,
  preferredEditor?: string,
): FinishedSessionNotification => {
  const sourceLabel = formatPlatformLabel(session.platform);
  const canOpenWorkspace = Boolean(session.workspacePath);

  return {
    actionText: canOpenWorkspace ? formatActionText(preferredEditor) : undefined,
    body: formatContext(session, hotkeyEnabled),
    signature: getFinishedSessionSignature(session),
    subtitle: formatSubtitle(session),
    title: `${sourceLabel} finished`,
    workspacePath: session.workspacePath,
  };
};

export const getFinishedSessionNotifications = ({
  allowNewDoneSessions,
  hotkeyEnabled,
  nextSessions,
  preferredEditor,
  notifiedSignatures,
  previousSessions,
}: FinishedSessionNotificationParams): FinishedSessionNotification[] => {
  const previousById = new Map(parseSessions(previousSessions).map((session) => [session.id, session]));

  return parseSessions(nextSessions)
    .map((session) => {
      const previousSession = previousById.get(session.id);
      if (!previousSession) {
        return session;
      }

      return {
        ...previousSession,
        ...session,
        endedAt: session.endedAt ?? previousSession.endedAt,
        gitBranch: session.gitBranch ?? previousSession.gitBranch,
        platform: session.platform ?? previousSession.platform,
        project: session.project ?? previousSession.project,
        startedAt: session.startedAt ?? previousSession.startedAt,
        title: session.title || previousSession.title,
        workspacePath: session.workspacePath ?? previousSession.workspacePath,
      };
    })
    .filter((session) => {
      if (session.status !== "done") {
        return false;
      }

      const signature = getFinishedSessionSignature(session);
      if (notifiedSignatures.has(signature)) {
        return false;
      }

      const previousSession = previousById.get(session.id);
      if (!previousSession) {
        return allowNewDoneSessions;
      }

      return previousSession.status !== "done";
    })
    .map((session) => buildFinishedSessionNotification(session, hotkeyEnabled, preferredEditor));
};
