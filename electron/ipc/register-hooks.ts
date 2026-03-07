import type { IpcMain } from "electron";
import { readHookSessions } from "../hooks/session-service.js";
import { getClaudeStatus, installClaudeHooks, uninstallClaudeHooks } from "../hooks/platforms/claude.js";
import { getCursorStatus, installCursorHooks, uninstallCursorHooks } from "../hooks/platforms/cursor.js";
import { getVsCodeStatus, installVsCodeHooks, uninstallVsCodeHooks } from "../hooks/platforms/vscode.js";
import type { HookPlatform, HookPlatformStatus } from "../hooks/types.js";

interface HookIpcDeps {
  ipcMain: Pick<IpcMain, "handle">;
  hookInstalled: (platform: HookPlatform, mode: string) => void;
}

const statusHandlers = {
  Claude: getClaudeStatus,
  Cursor: getCursorStatus,
  VSCode: getVsCodeStatus,
} as const;

const installHandlers = {
  Claude: installClaudeHooks,
  Cursor: installCursorHooks,
  VSCode: installVsCodeHooks,
} as const;

const uninstallHandlers = {
  Claude: uninstallClaudeHooks,
  Cursor: uninstallCursorHooks,
  VSCode: uninstallVsCodeHooks,
} as const;

export const registerHookIpc = ({ ipcMain, hookInstalled }: HookIpcDeps): void => {
  ipcMain.handle("hooks/get-sessions", async () => {
    return await readHookSessions();
  });

  ipcMain.handle("hooks/get-status", async (_event, platform: HookPlatform): Promise<HookPlatformStatus> => {
    return await statusHandlers[platform]();
  });

  ipcMain.handle("hooks/install", async (_event, platform: HookPlatform) => {
    const result = await installHandlers[platform]();
    if (result.success) {
      hookInstalled(platform, result.mode);
    }
    return result;
  });

  ipcMain.handle("hooks/uninstall", async (_event, platform: HookPlatform) => {
    return await uninstallHandlers[platform]();
  });
};
