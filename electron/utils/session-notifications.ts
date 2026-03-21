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
  const workspaceLabel = session.workspacePath ? path.basename(session.workspacePath) : undefined;
  const primaryLabel = session.project || workspaceLabel;

  if (primaryLabel && session.gitBranch) {
    return `${primaryLabel} - ${session.gitBranch}`;
  }

  return primaryLabel || session.gitBranch;
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
): FinishedSessionNotification => {
  const sourceLabel = formatPlatformLabel(session.platform);
  const taskLabel = session.title.trim() || "the current task";
  const canOpenWorkspace = Boolean(session.workspacePath);
  const body = canOpenWorkspace
    ? hotkeyEnabled
      ? "Go to it now or press Cmd+Shift+G for more information."
      : "Go to it now for more information."
    : hotkeyEnabled
      ? "Press Cmd+Shift+G for more information."
      : "Open Galactic for more information.";

  return {
    actionText: canOpenWorkspace ? "Go to" : undefined,
    body,
    signature: getFinishedSessionSignature(session),
    subtitle: formatSubtitle(session),
    title: `${sourceLabel} has finished ${taskLabel}`,
    workspacePath: session.workspacePath,
  };
};

export const getFinishedSessionNotifications = ({
  allowNewDoneSessions,
  hotkeyEnabled,
  nextSessions,
  notifiedSignatures,
  previousSessions,
}: FinishedSessionNotificationParams): FinishedSessionNotification[] => {
  const previousById = new Map(parseSessions(previousSessions).map((session) => [session.id, session]));

  return parseSessions(nextSessions)
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
    .map((session) => buildFinishedSessionNotification(session, hotkeyEnabled));
};
