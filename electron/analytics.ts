import TelemetryDeck from "@telemetrydeck/sdk";
import crypto from "node:crypto";
import os from "node:os";
import { app } from "electron";

const TELEMETRYDECK_APP_ID = process.env.TELEMETRYDECK_APP_ID ?? "";

let telemetryClient: TelemetryDeck | null = null;

// Generate a unique user ID based on machine ID (hashed for privacy)
const getUserId = (): string => {
  const machineId = `${process.platform}-${process.arch}-${os.hostname()}`;
  return crypto.createHash("sha256").update(machineId).digest("hex").slice(0, 16);
};

export const ANALYTICS_EVENTS = [
  "App.launched",
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
  "Update.completed",
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

export const isAnalyticsEvent = (value: string): value is AnalyticsEvent =>
  ANALYTICS_EVENTS.includes(value as AnalyticsEvent);

export const initAnalytics = (): void => {
  if (telemetryClient) return;
  if (!TELEMETRYDECK_APP_ID) {
    console.log("[Analytics] Disabled - no app ID configured");
    return;
  }

  try {
    telemetryClient = new TelemetryDeck({
      appID: TELEMETRYDECK_APP_ID,
      clientUser: getUserId(),
      subtleCrypto: crypto.webcrypto.subtle as never,
    });
    console.log("[Analytics] TelemetryDeck initialized");
  } catch (error) {
    console.error("[Analytics] Failed to initialize TelemetryDeck:", error);
  }
};

interface EventPayload {
  [key: string]: string | number | boolean;
}

export const trackEvent = (event: AnalyticsEvent, payload?: EventPayload): void => {
  if (!telemetryClient) {
    console.warn("[Analytics] TelemetryDeck not initialized, skipping event:", event);
    return;
  }

  try {
    const enrichedPayload: Record<string, string> = {
      appVersion: app.getVersion(),
      platform: process.platform,
      ...Object.fromEntries(
        Object.entries(payload ?? {}).map(([k, v]) => [k, String(v)])
      ),
    };

    telemetryClient.signal(event, enrichedPayload);
    console.log("[Analytics] Tracked event:", event, enrichedPayload);
  } catch (error) {
    console.error("[Analytics] Failed to track event:", event, error);
  }
};

// Convenience functions for each event type
export const analytics = {
  appLaunched: () => trackEvent("App.launched"),

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

  quickLauncherToggled: (visible: boolean, source?: string) =>
    trackEvent("QuickLauncher.toggled", { visible, source: source ?? "unknown" }),

  quickLauncherNavigated: (direction: "up" | "down") =>
    trackEvent("QuickLauncher.navigated", { direction }),

  quickLauncherWorkspaceOpened: (targetType: string, source?: string) =>
    trackEvent("QuickLauncher.workspaceOpened", { targetType, source: source ?? "unknown" }),

  updateCompleted: (version: string) =>
    trackEvent("Update.completed", { version }),
};
