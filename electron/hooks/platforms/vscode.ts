import { ensureHookRunnerInstalled } from "../assets.js";
import { hasStringArrayValue, removeStringArraySetting, upsertStringArraySetting } from "../json-settings.js";
import { updateHookInstallRecord } from "../manifest.js";
import { getVsCodeHookFilePath, getVsCodeSettingsPath } from "../paths.js";
import { writeHookFile } from "../hook-file.js";
import type { HookInstallResult, HookPlatformStatus } from "../types.js";

const settingsKey = "chat.hookFilesLocations";

const manualSteps = (hookFilePath: string) => [
  "Open VS Code and run `Chat: Configure Hooks`.",
  `Add \`${hookFilePath}\` to hook file locations.`,
];

export const getVsCodeStatus = async (homeDirectory?: string): Promise<HookPlatformStatus> => {
  const hookFilePath = getVsCodeHookFilePath(homeDirectory);
  const settingsPath = getVsCodeSettingsPath(homeDirectory);
  const installed = await hasStringArrayValue(settingsPath, settingsKey, hookFilePath);
  return {
    platform: "VSCode",
    supported: true,
    available: true,
    installed,
    mode: "automatic",
    requiresManual: false,
    summary: installed ? "VS Code hook file registered." : "Ready to register a Galactic hook file.",
    manualSteps: manualSteps(hookFilePath),
  };
};

export const installVsCodeHooks = async (homeDirectory?: string): Promise<HookInstallResult> => {
  const hookFilePath = getVsCodeHookFilePath(homeDirectory);
  const settingsPath = getVsCodeSettingsPath(homeDirectory);
  const commandPath = await ensureHookRunnerInstalled(homeDirectory);
  await writeHookFile(hookFilePath, commandPath, "vscode");

  const result = await upsertStringArraySetting(settingsPath, settingsKey, hookFilePath);
  if (result.error) {
    return {
      success: false,
      platform: "VSCode",
      installed: false,
      mode: "automatic",
      error: result.error,
      manualSteps: manualSteps(hookFilePath),
    };
  }

  await updateHookInstallRecord(
    "VSCode",
    { installedAt: new Date().toISOString(), mode: "automatic", reference: hookFilePath },
    homeDirectory,
  );
  return { success: true, platform: "VSCode", installed: true, mode: "automatic" };
};

export const uninstallVsCodeHooks = async (homeDirectory?: string): Promise<HookInstallResult> => {
  const hookFilePath = getVsCodeHookFilePath(homeDirectory);
  const settingsPath = getVsCodeSettingsPath(homeDirectory);
  await removeStringArraySetting(settingsPath, settingsKey, hookFilePath);
  await updateHookInstallRecord("VSCode", null, homeDirectory);
  return { success: true, platform: "VSCode", installed: false, mode: "automatic" };
};
