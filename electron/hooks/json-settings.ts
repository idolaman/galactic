import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import JSON5 from "json5";

export interface JsonSettingsUpdateResult {
  changed: boolean;
  error?: string;
}

const readSettings = async (filePath: string): Promise<Record<string, unknown>> => {
  if (!existsSync(filePath)) {
    return {};
  }

  const content = await fs.readFile(filePath, "utf8");
  const parsed = JSON5.parse(content);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Settings root must be a JSON object.");
  }
  return parsed as Record<string, unknown>;
};

const writeSettings = async (filePath: string, settings: Record<string, unknown>) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(settings, null, 2), "utf8");
};

export const upsertStringArraySetting = async (
  filePath: string,
  key: string,
  value: string,
): Promise<JsonSettingsUpdateResult> => {
  try {
    const settings = await readSettings(filePath);
    const current = Array.isArray(settings[key]) ? settings[key].filter((entry) => typeof entry === "string") : [];
    if (current.includes(value)) {
      return { changed: false };
    }

    settings[key] = [...current, value];
    await writeSettings(filePath, settings);
    return { changed: true };
  } catch (error) {
    return {
      changed: false,
      error: error instanceof Error ? error.message : "Unable to update settings.",
    };
  }
};

export const removeStringArraySetting = async (
  filePath: string,
  key: string,
  value: string,
): Promise<JsonSettingsUpdateResult> => {
  try {
    const settings = await readSettings(filePath);
    const current = Array.isArray(settings[key]) ? settings[key].filter((entry) => typeof entry === "string") : [];
    const next = current.filter((entry) => entry !== value);
    if (next.length === current.length) {
      return { changed: false };
    }

    if (next.length === 0) {
      delete settings[key];
    } else {
      settings[key] = next;
    }

    await writeSettings(filePath, settings);
    return { changed: true };
  } catch (error) {
    return {
      changed: false,
      error: error instanceof Error ? error.message : "Unable to update settings.",
    };
  }
};

export const hasStringArrayValue = async (filePath: string, key: string, value: string): Promise<boolean> => {
  try {
    const settings = await readSettings(filePath);
    return Array.isArray(settings[key]) && settings[key].includes(value);
  } catch {
    return false;
  }
};
