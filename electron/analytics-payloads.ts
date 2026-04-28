import type { AnalyticsEvent } from "./analytics-events.js";

export type AnalyticsPayload = Record<string, string | number | boolean>;

export interface AnalyticsContext {
  appVersion: string;
  platform: NodeJS.Platform;
}

const POSTHOG_SAFE_KEYS = new Set([
  "appVersion",
  "autoEnvState",
  "bindings",
  "configCount",
  "connectionCount",
  "direction",
  "editor",
  "envVars",
  "extension",
  "externalConnectionCount",
  "from",
  "hasDependencies",
  "hasEnvironment",
  "hasNonLiveDependencies",
  "hasWorkspace",
  "isEdit",
  "isFirstTimeSetup",
  "isGitRepo",
  "kind",
  "operation",
  "openingStep",
  "platform",
  "reason",
  "reassigned",
  "serviceCount",
  "source",
  "state",
  "status",
  "success",
  "targetKind",
  "targetType",
  "to",
  "tool",
  "version",
  "visible",
  "workspaceMode",
  "worktrees",
]);

export const buildTelemetryDeckPayload = (
  payload: AnalyticsPayload | undefined,
  context: AnalyticsContext,
): Record<string, string> => ({
  appVersion: context.appVersion,
  platform: context.platform,
  ...Object.fromEntries(Object.entries(payload ?? {}).map(([key, value]) => [key, String(value)])),
});

export const buildPostHogProperties = (
  _event: AnalyticsEvent,
  payload: AnalyticsPayload | undefined,
  context: AnalyticsContext,
): AnalyticsPayload => {
  const properties: AnalyticsPayload = {
    appVersion: context.appVersion,
    platform: context.platform,
  };

  for (const [key, value] of Object.entries(payload ?? {})) {
    if (POSTHOG_SAFE_KEYS.has(key)) {
      properties[key] = value;
    }
  }

  return properties;
};
