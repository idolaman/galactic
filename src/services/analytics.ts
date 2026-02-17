import type { AnalyticsEvent, AnalyticsPayload } from "@/types/analytics";

const cleanPayload = (
  payload?: AnalyticsPayload,
): Record<string, string | number | boolean> | undefined => {
  if (!payload) return undefined;
  const entries = Object.entries(payload).filter(([, value]) => value !== undefined);
  return Object.fromEntries(entries) as Record<string, string | number | boolean>;
};

export const trackAnalyticsEvent = (event: AnalyticsEvent, payload?: AnalyticsPayload): void => {
  if (typeof window === "undefined") return;

  try {
    const cleanedPayload = cleanPayload(payload);
    void window.electronAPI?.trackAnalyticsEvent?.(event, cleanedPayload);
  } catch (error) {
    console.warn("[Analytics] Failed to send event", event, error);
  }
};

export const trackProjectAdded = (isGitRepo: boolean, worktrees: number): void => {
  trackAnalyticsEvent("Project.added", { isGitRepo, worktrees });
};

export const trackProjectRemoved = (worktrees: number, configCount: number): void => {
  trackAnalyticsEvent("Project.removed", { worktrees, configCount });
};

export const trackConfigFileAdded = (
  targetPath: string,
  kind: "file" | "directory" = "file",
): void => {
  const extension = kind === "directory"
    ? "directory"
    : targetPath.split(".").pop()?.toLowerCase() ?? "unknown";
  trackAnalyticsEvent("Workspace.configFileAdded", { extension, kind });
};

export const trackEnvironmentCreated = (address: string): void => {
  trackAnalyticsEvent("Environment.created", { address });
};

export const trackEnvironmentDeleted = (bindingCount: number): void => {
  trackAnalyticsEvent("Environment.deleted", { bindings: bindingCount });
};

export const trackEnvironmentAttached = (
  targetKind: string,
  envVarsCount: number,
  reassigned?: boolean,
): void => {
  trackAnalyticsEvent("Environment.attached", { targetKind, envVars: envVarsCount, reassigned });
};

export const trackEnvironmentDetached = (targetKind: string): void => {
  trackAnalyticsEvent("Environment.detached", { targetKind });
};

export const trackEnvironmentUpdated = (envVarsCount: number): void => {
  trackAnalyticsEvent("Environment.updated", { envVars: envVarsCount });
};

export const trackQuickLauncherNavigation = (direction: "up" | "down"): void => {
  trackAnalyticsEvent("QuickLauncher.navigated", { direction });
};

export const trackQuickLauncherWorkspaceOpened = (targetType: string, source: string): void => {
  trackAnalyticsEvent("QuickLauncher.workspaceOpened", { targetType, source });
};

export const trackMcpSessionFocus = (status: string, hasWorkspace: boolean): void => {
  trackAnalyticsEvent("MCP.sessionFocused", { status, hasWorkspace });
};

export const trackMcpSessionStatusChange = (fromStatus: string, toStatus: string): void => {
  trackAnalyticsEvent("MCP.sessionStatusChanged", { from: fromStatus, to: toStatus });
};
