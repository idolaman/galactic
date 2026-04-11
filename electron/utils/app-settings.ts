import { existsSync } from "node:fs";
import { promises as fsPromises } from "node:fs";
import path from "node:path";

export interface AppSettings {
  eventNotificationsEnabled: boolean;
  quickSidebarHotkeyEnabled: boolean;
  workspaceIsolationShellHooksEnabled: boolean;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  eventNotificationsEnabled: true,
  quickSidebarHotkeyEnabled: false,
  workspaceIsolationShellHooksEnabled: false,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getBoolean = (value: unknown, fallback: boolean): boolean =>
  typeof value === "boolean" ? value : fallback;

export const normalizeAppSettings = (value: unknown): AppSettings => {
  const parsed = isRecord(value) ? value : {};
  return {
    eventNotificationsEnabled: getBoolean(
      parsed.eventNotificationsEnabled,
      DEFAULT_APP_SETTINGS.eventNotificationsEnabled,
    ),
    quickSidebarHotkeyEnabled: getBoolean(
      parsed.quickSidebarHotkeyEnabled,
      DEFAULT_APP_SETTINGS.quickSidebarHotkeyEnabled,
    ),
    workspaceIsolationShellHooksEnabled: getBoolean(
      parsed.workspaceIsolationShellHooksEnabled,
      DEFAULT_APP_SETTINGS.workspaceIsolationShellHooksEnabled,
    ),
  };
};

export const loadAppSettings = async (settingsPath: string): Promise<AppSettings> => {
  if (!existsSync(settingsPath)) {
    return { ...DEFAULT_APP_SETTINGS };
  }

  try {
    const raw = await fsPromises.readFile(settingsPath, "utf-8");
    return normalizeAppSettings(JSON.parse(raw));
  } catch (error) {
    console.warn("Failed to read app settings:", error);
    return { ...DEFAULT_APP_SETTINGS };
  }
};

export const saveAppSettings = async (settingsPath: string, settings: AppSettings) => {
  try {
    await fsPromises.mkdir(path.dirname(settingsPath), { recursive: true });
    await fsPromises.writeFile(settingsPath, JSON.stringify(settings, null, 2), "utf-8");
  } catch (error) {
    console.warn("Failed to save app settings:", error);
  }
};
