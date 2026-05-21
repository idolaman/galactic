import type { WorkspaceConsoleStatus } from "@/types/workspace-console";

export type WorkspaceConsoleSource = "new-shell" | "restore-bar" | "workspace-card";
export type WorkspaceConsoleTargetKind = "base" | "unknown" | "workspace";
export type WorkspaceConsoleSize = "docked" | "expanded";
export type WorkspaceConsoleExitCodeBucket = "nonzero" | "unknown" | "zero";
export type WorkspaceConsoleErrorKind =
  | "cwd-invalid"
  | "desktop-unavailable"
  | "session-missing"
  | "spawn-failed"
  | "unknown";

export type WorkspaceConsoleTrackedStatus = WorkspaceConsoleStatus | "unknown";

const knownTargetKinds: WorkspaceConsoleTargetKind[] = [
  "base",
  "workspace",
  "unknown",
];

const errorMatchers: Array<[WorkspaceConsoleErrorKind, string[]]> = [
  ["desktop-unavailable", ["desktop app", "desktop bridge"]],
  ["cwd-invalid", ["outside workspace", "cwd", "working directory"]],
  ["session-missing", ["session not found", "unknown session", "missing session"]],
  ["spawn-failed", ["spawn", "shell", "terminal could not start"]],
];

export const normalizeWorkspaceConsoleTargetKind = (
  targetKind?: string,
): WorkspaceConsoleTargetKind =>
  knownTargetKinds.includes(targetKind as WorkspaceConsoleTargetKind)
    ? (targetKind as WorkspaceConsoleTargetKind)
    : "unknown";

export const normalizeWorkspaceConsoleStatus = (
  status?: WorkspaceConsoleStatus,
): WorkspaceConsoleTrackedStatus => status ?? "unknown";

export const getWorkspaceConsoleExitCodeBucket = (
  exitCode?: number,
): WorkspaceConsoleExitCodeBucket => {
  if (typeof exitCode !== "number") return "unknown";
  return exitCode === 0 ? "zero" : "nonzero";
};

export const getWorkspaceConsoleErrorKind = (
  error?: string,
): WorkspaceConsoleErrorKind => {
  const normalizedError = error?.toLowerCase() ?? "";
  const match = errorMatchers.find(([, fragments]) =>
    fragments.some((fragment) => normalizedError.includes(fragment)),
  );
  return match?.[0] ?? "unknown";
};
