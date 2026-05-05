import { app } from "electron";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  asOptionalBooleanFlag,
  asTrimmedString,
  getFirstEnvValue,
  parseEnvFile,
} from "./release-config-env.js";

interface EmbeddedReleaseConfig {
  galacticUpdateUrl?: unknown;
  posthogHost?: unknown;
  posthogProjectKey?: unknown;
  posthogSessionReplayEnabled?: unknown;
  telemetrydeckAppId?: unknown;
}

let cachedEmbeddedConfig: EmbeddedReleaseConfig | null = null;
let cachedDevEnv: Record<string, string> | null = null;

const getEmbeddedReleaseConfig = (): EmbeddedReleaseConfig => {
  if (cachedEmbeddedConfig) {
    return cachedEmbeddedConfig;
  }

  if (!app.isPackaged) {
    cachedEmbeddedConfig = {};
    return cachedEmbeddedConfig;
  }

  try {
    const appPackagePath = path.join(app.getAppPath(), "package.json");
    const parsed = JSON.parse(readFileSync(appPackagePath, "utf-8")) as EmbeddedReleaseConfig;
    cachedEmbeddedConfig = parsed;
  } catch (error) {
    console.warn("[ReleaseConfig] Failed to read embedded release config:", error);
    cachedEmbeddedConfig = {};
  }

  return cachedEmbeddedConfig;
};

const getDevEnv = (): Record<string, string> => {
  if (cachedDevEnv) {
    return cachedDevEnv;
  }

  if (app.isPackaged) {
    cachedDevEnv = {};
    return cachedDevEnv;
  }

  try {
    cachedDevEnv = parseEnvFile(readFileSync(path.join(process.cwd(), ".env"), "utf-8"));
  } catch {
    cachedDevEnv = {};
  }

  return cachedDevEnv;
};

const getDevEnvValue = (...keys: string[]): string => {
  return getFirstEnvValue(getDevEnv(), ...keys);
};

export const getGalacticUpdateUrl = (): string => {
  const envValue = asTrimmedString(process.env.GALACTIC_UPDATE_URL);
  if (envValue) {
    return envValue;
  }
  const devEnvValue = getDevEnvValue("GALACTIC_UPDATE_URL");
  if (devEnvValue) {
    return devEnvValue;
  }
  return asTrimmedString(getEmbeddedReleaseConfig().galacticUpdateUrl);
};

export const getTelemetryDeckAppId = (): string => {
  const envValue = asTrimmedString(process.env.TELEMETRYDECK_APP_ID);
  if (envValue) {
    return envValue;
  }
  const devEnvValue = getDevEnvValue("TELEMETRYDECK_APP_ID");
  if (devEnvValue) {
    return devEnvValue;
  }
  return asTrimmedString(getEmbeddedReleaseConfig().telemetrydeckAppId);
};

export const getPostHogProjectKey = (): string => {
  const envValue = asTrimmedString(process.env.POSTHOG_PROJECT_KEY);
  if (envValue) {
    return envValue;
  }
  const devEnvValue = getDevEnvValue("POSTHOG_PROJECT_KEY", "VITE_PUBLIC_POSTHOG_KEY");
  if (devEnvValue) {
    return devEnvValue;
  }
  return asTrimmedString(getEmbeddedReleaseConfig().posthogProjectKey);
};

export const getPostHogHost = (): string => {
  const envValue = asTrimmedString(process.env.POSTHOG_HOST);
  if (envValue) {
    return envValue;
  }
  const devEnvValue = getDevEnvValue("POSTHOG_HOST", "VITE_PUBLIC_POSTHOG_HOST");
  if (devEnvValue) {
    return devEnvValue;
  }
  return asTrimmedString(getEmbeddedReleaseConfig().posthogHost) || "https://us.i.posthog.com";
};

export const getPostHogSessionReplayEnabled = (): boolean => {
  const envValue = asOptionalBooleanFlag(process.env.POSTHOG_SESSION_REPLAY_ENABLED);
  if (envValue !== undefined) {
    return envValue;
  }

  const devEnvValue = asOptionalBooleanFlag(getDevEnvValue("POSTHOG_SESSION_REPLAY_ENABLED"));
  if (devEnvValue !== undefined) {
    return devEnvValue;
  }

  return asOptionalBooleanFlag(getEmbeddedReleaseConfig().posthogSessionReplayEnabled) ?? false;
};
