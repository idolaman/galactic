import { app } from "electron";

import { getAnalyticsDistinctId } from "./analytics-identity.js";
import { initPostHog, capturePostHogEvent, shutdownPostHog } from "./analytics-posthog.js";
import { captureTelemetryDeckEvent, initTelemetryDeck } from "./analytics-telemetrydeck.js";
import { type AnalyticsEvent, isAnalyticsEvent } from "./analytics-events.js";
import type { AnalyticsPayload } from "./analytics-payloads.js";

export { ANALYTICS_EVENTS, isAnalyticsEvent } from "./analytics-events.js";

export const ANALYTICS_EVENTS = [
  "App.launched",
  "Auth.completed",
  "Auth.failed",
  "Auth.signedOut",
  "Auth.started",
  "Error.gitFailed",
  "Workspace.created",
  "Workspace.deleted",
  "Workspace.configFileAdded",
  "Workspace.filesCopied",
  "Project.added",
  "Project.removed",
  "MCP.connected",
  "MCP.sessionFocused",
  "MCP.sessionStatusChanged",
  "Environment.created",
  "Environment.deleted",
  "Environment.attached",
  "Environment.detached",
  "Environment.updated",
  "Editor.launched",
  "QuickLauncher.toggled",
  "QuickLauncher.navigated",
  "QuickLauncher.workspaceOpened",
  "WorkspaceIsolation.dialogOpened",
  "WorkspaceIsolation.infoDialogOpened",
  "WorkspaceIsolation.introContinued",
  "WorkspaceIsolation.autoEnvEnableAttempted",
  "WorkspaceIsolation.autoEnvEnableCompleted",
  "WorkspaceIsolation.configurationAdvanced",
  "WorkspaceIsolation.saved",
  "WorkspaceIsolation.deleted",
  "Update.completed",
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

export const isAnalyticsEvent = (value: string): value is AnalyticsEvent =>
  ANALYTICS_EVENTS.includes(value as AnalyticsEvent);

const analyticsDistinctId = getAnalyticsDistinctId();

export const initAnalytics = (): void => {
  initTelemetryDeck(analyticsDistinctId);
  initPostHog();
};

export const shutdownAnalytics = async (): Promise<void> => {
  await shutdownPostHog();
};

export const trackEvent = (event: AnalyticsEvent, payload?: AnalyticsPayload): void => {
  const context = { appVersion: app.getVersion(), platform: process.platform };
  captureTelemetryDeckEvent(event, context, payload);
  capturePostHogEvent(event, analyticsDistinctId, context, payload);
};

// Convenience functions for each event type
export const analytics = {
  appLaunched: () => trackEvent("App.launched"),

  authCompleted: (provider?: string) =>
    trackEvent("Auth.completed", provider ? { provider } : undefined),

  authFailed: (provider?: string, reason?: string) =>
    trackEvent("Auth.failed", { provider: provider ?? "unknown", reason: reason ?? "unknown" }),

  authSignedOut: () => trackEvent("Auth.signedOut"),

  authStarted: (provider: string) =>
    trackEvent("Auth.started", { provider }),

  gitFailed: (operation: string, error: string) =>
    trackEvent("Error.gitFailed", { operation, error: error.slice(0, 200) }),

  workspaceCreated: (branch: string) =>
    trackEvent("Workspace.created", { branch }),

  workspaceDeleted: (pathHint?: string) =>
    trackEvent("Workspace.deleted", { pathHint: pathHint ?? "unknown" }),

  workspaceConfigFileAdded: (extension: string) =>
    trackEvent("Workspace.configFileAdded", { extension }),

  workspaceFilesCopied: (count: number, success: boolean) =>
    trackEvent("Workspace.filesCopied", { count, success }),

  projectAdded: (isGitRepo: boolean, worktrees: number) =>
    trackEvent("Project.added", { isGitRepo, worktrees }),

  projectRemoved: (worktrees: number, configCount: number) =>
    trackEvent("Project.removed", { worktrees, configCount }),

  userLoggedIn: () => trackEvent("User.loggedIn"),

  userLoggedOut: () => trackEvent("User.loggedOut"),

  mcpConnected: (tool: string) =>
    trackEvent("MCP.connected", { tool }),

  mcpSessionFocused: (status: string, hasWorkspace: boolean) =>
    trackEvent("MCP.sessionFocused", { status, hasWorkspace }),

  mcpSessionStatusChanged: (from: string, to: string) =>
    trackEvent("MCP.sessionStatusChanged", { from, to }),

  environmentCreated: (address: string) =>
    trackEvent("Environment.created", { address }),

  environmentDeleted: (bindings: number) =>
    trackEvent("Environment.deleted", { bindings }),

  environmentAttached: (targetKind: string, envVars: number, reassigned?: boolean) =>
    trackEvent("Environment.attached", { targetKind, envVars, reassigned: reassigned ?? false }),

  environmentDetached: (targetKind: string) =>
    trackEvent("Environment.detached", { targetKind }),

  environmentUpdated: (envVars: number) =>
    trackEvent("Environment.updated", { envVars }),

  editorLaunched: (editor: string) =>
    trackEvent("Editor.launched", { editor }),

  settingsEditorChanged: (editor: string) =>
    trackEvent("Settings.editorChanged", { editor }),

  settingsMcpInstalled: (tool: string) =>
    trackEvent("Settings.mcpInstalled", { tool }),

  quickLauncherToggled: (visible: boolean, source?: string) =>
    trackEvent("QuickLauncher.toggled", { visible, source: source ?? "unknown" }),

  quickLauncherNavigated: (direction: "up" | "down") =>
    trackEvent("QuickLauncher.navigated", { direction }),

  quickLauncherWorkspaceOpened: (targetType: string, source?: string) =>
    trackEvent("QuickLauncher.workspaceOpened", { targetType, source: source ?? "unknown" }),

  updateCompleted: (version: string) =>
    trackEvent("Update.completed", { version }),
};
