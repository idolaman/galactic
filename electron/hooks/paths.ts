import os from "node:os";
import path from "node:path";
import process from "node:process";
import type { HookPlatform } from "./types.js";

const getAppDataDirectory = (homeDirectory: string) => {
  if (process.platform === "win32") {
    return process.env.APPDATA ?? path.join(homeDirectory, "AppData", "Roaming");
  }
  return homeDirectory;
};

export const getGalacticHome = (homeDirectory = os.homedir()) => {
  return path.join(homeDirectory, ".galactic");
};

export const getGalacticBinDirectory = (homeDirectory = os.homedir()) => {
  return path.join(getGalacticHome(homeDirectory), "bin");
};

export const getHookRunnerPath = (homeDirectory = os.homedir()) => {
  return path.join(getGalacticBinDirectory(homeDirectory), "galactic-hook.mjs");
};

export const getHookCommandPath = (homeDirectory = os.homedir()) => {
  const fileName = process.platform === "win32" ? "galactic-hook.cmd" : "galactic-hook";
  return path.join(getGalacticBinDirectory(homeDirectory), fileName);
};

export const getPlatformRoot = (platform: HookPlatform, homeDirectory = os.homedir()) => {
  return path.join(getGalacticHome(homeDirectory), "platforms", platform.toLowerCase());
};

export const getHookEventLogPath = (homeDirectory = os.homedir()) => {
  return path.join(getGalacticHome(homeDirectory), "state", "agent-events.ndjson");
};

export const getHookManifestPath = (homeDirectory = os.homedir()) => {
  return path.join(getGalacticHome(homeDirectory), "state", "install-manifest.json");
};

export const getVsCodeHookFilePath = (homeDirectory = os.homedir()) => {
  return path.join(getPlatformRoot("VSCode", homeDirectory), "hooks.json");
};

export const getCursorHookFilePath = (homeDirectory = os.homedir()) => {
  return path.join(getPlatformRoot("Cursor", homeDirectory), "hooks.json");
};

export const getClaudeMarketplaceRoot = (homeDirectory = os.homedir()) => {
  return path.join(getPlatformRoot("Claude", homeDirectory), "marketplace");
};

export const getVsCodeSettingsPath = (homeDirectory = os.homedir()) => {
  if (process.platform === "darwin") {
    return path.join(homeDirectory, "Library", "Application Support", "Code", "User", "settings.json");
  }
  if (process.platform === "win32") {
    return path.join(getAppDataDirectory(homeDirectory), "Code", "User", "settings.json");
  }
  return path.join(homeDirectory, ".config", "Code", "User", "settings.json");
};
