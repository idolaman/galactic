import TelemetryDeck from "@telemetrydeck/sdk";
import crypto from "node:crypto";
import os from "node:os";
import { app } from "electron";

const TELEMETRYDECK_APP_ID = "***REDACTED***";

let telemetryClient: TelemetryDeck | null = null;

// Generate a unique user ID based on machine ID (hashed for privacy)
const getUserId = (): string => {
  const machineId = `${process.platform}-${process.arch}-${os.hostname()}`;
  return crypto.createHash("sha256").update(machineId).digest("hex").slice(0, 16);
};

export const initAnalytics = (): void => {
  if (telemetryClient) return;

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

export type AnalyticsEvent =
  | "App.launched"
  | "Error.gitFailed"
  | "Workspace.created"
  | "MCP.connected"
  | "Environment.created"
  | "Editor.launched"
  | "QuickLauncher.toggled"
  | "Update.completed";

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

  mcpConnected: (tool: string) =>
    trackEvent("MCP.connected", { tool }),

  environmentCreated: (address: string) =>
    trackEvent("Environment.created", { address }),

  editorLaunched: (editor: string) =>
    trackEvent("Editor.launched", { editor }),

  quickLauncherToggled: (visible: boolean) =>
    trackEvent("QuickLauncher.toggled", { visible }),

  updateCompleted: (version: string) =>
    trackEvent("Update.completed", { version }),
};
