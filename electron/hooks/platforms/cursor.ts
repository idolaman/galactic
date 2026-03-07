import { ensureHookRunnerInstalled } from "../assets.js";
import { updateHookInstallRecord } from "../manifest.js";
import { getCursorHookFilePath } from "../paths.js";
import { writeHookFile } from "../hook-file.js";
import type { HookInstallResult, HookPlatformStatus } from "../types.js";

const buildManualSteps = (hookFilePath: string) => [
  "Open Cursor hook settings for your profile.",
  `Register \`${hookFilePath}\` as a Galactic hook file.`,
  "Keep other Cursor hooks unchanged; Galactic only needs an additional hook file reference.",
];

export const getCursorStatus = async (homeDirectory?: string): Promise<HookPlatformStatus> => {
  const hookFilePath = getCursorHookFilePath(homeDirectory);
  return {
    platform: "Cursor",
    supported: true,
    available: true,
    installed: false,
    mode: "manual",
    requiresManual: true,
    summary: "Cursor assets can be prepared, but installation stays manual to avoid mutating your Cursor config.",
    manualSteps: buildManualSteps(hookFilePath),
  };
};

export const installCursorHooks = async (homeDirectory?: string): Promise<HookInstallResult> => {
  const hookFilePath = getCursorHookFilePath(homeDirectory);
  const commandPath = await ensureHookRunnerInstalled(homeDirectory);
  await writeHookFile(hookFilePath, commandPath, "cursor");
  await updateHookInstallRecord(
    "Cursor",
    { installedAt: new Date().toISOString(), mode: "manual", reference: hookFilePath },
    homeDirectory,
  );
  return {
    success: true,
    platform: "Cursor",
    installed: false,
    mode: "manual",
    manualSteps: buildManualSteps(hookFilePath),
  };
};

export const uninstallCursorHooks = async (homeDirectory?: string): Promise<HookInstallResult> => {
  await updateHookInstallRecord("Cursor", null, homeDirectory);
  return { success: true, platform: "Cursor", installed: false, mode: "manual" };
};
