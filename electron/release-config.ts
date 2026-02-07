import { app } from "electron";
import { readFileSync } from "node:fs";
import path from "node:path";

interface EmbeddedReleaseConfig {
  galacticUpdateUrl?: unknown;
  telemetrydeckAppId?: unknown;
}

let cachedEmbeddedConfig: EmbeddedReleaseConfig | null = null;

const asTrimmedString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

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

export const getGalacticUpdateUrl = (): string => {
  const envValue = asTrimmedString(process.env.GALACTIC_UPDATE_URL);
  if (envValue) {
    return envValue;
  }
  return asTrimmedString(getEmbeddedReleaseConfig().galacticUpdateUrl);
};

export const getTelemetryDeckAppId = (): string => {
  const envValue = asTrimmedString(process.env.TELEMETRYDECK_APP_ID);
  if (envValue) {
    return envValue;
  }
  return asTrimmedString(getEmbeddedReleaseConfig().telemetrydeckAppId);
};
