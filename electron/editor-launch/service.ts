import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import os from "node:os";
import process from "node:process";
import { promisify } from "node:util";
import {
  editorCandidateOrder,
  editorCliCommands,
  editorLaunchCommands,
  getEditorBundlePaths,
  supportedEditors,
} from "./constants.js";
import type {
  EditorLaunchService,
  EditorLaunchServiceDeps,
  OpenProjectInEditorResult,
  SupportedEditorName,
} from "./types.js";
const defaultExecFileAsync = promisify(execFile);
export const parseEditorName = (editorName: string): SupportedEditorName | null => {
  return supportedEditors.find((editor) => editor === editorName) ?? null;
};
export const getFriendlyEditorLaunchError = (editorName: SupportedEditorName, error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("unable to find application named")) {
    return `${editorName} is not installed on this machine.`;
  }

  if (
    normalizedMessage.includes("command not found") ||
    normalizedMessage.includes("is not recognized") ||
    normalizedMessage.includes("enoent")
  ) {
    return `${editorName} command launcher is unavailable.`;
  }

  return `Unable to launch ${editorName}.`;
};
export const createEditorLaunchService = (deps: EditorLaunchServiceDeps = {}): EditorLaunchService => {
  const platform = deps.platform ?? process.platform;
  const homeDirectory = deps.homeDirectory ?? os.homedir();
  const pathExists = deps.pathExists ?? existsSync;
  const execFileAsync = deps.execFileAsync ?? defaultExecFileAsync;
  const logError = deps.logError ?? ((message: string, error: unknown) => console.error(message, error));
  const editorBundlePaths = getEditorBundlePaths(homeDirectory);

  const checkCommandExists = async (command: string) => {
    const commandByPlatform: Partial<Record<NodeJS.Platform, string>> = {
      darwin: "which",
      linux: "which",
      win32: "where",
    };
    const lookupCommand = commandByPlatform[platform];
    if (!lookupCommand) {
      return false;
    }

    try {
      await execFileAsync(lookupCommand, [command]);
      return true;
    } catch {
      return false;
    }
  };

  const isEditorInstalled = async (editorName: SupportedEditorName) => {
    if (platform === "darwin" && editorBundlePaths[editorName].some((bundlePath) => pathExists(bundlePath))) {
      return true;
    }

    return await checkCommandExists(editorCliCommands[editorName]);
  };

  const resolveAvailableEditors = async (preferredEditor: SupportedEditorName, projectPath: string) => {
    const candidates: Array<{ editor: SupportedEditorName; command: string; args: string[] }> = [];

    for (const editor of editorCandidateOrder[preferredEditor]) {
      const launchCommand = editorLaunchCommands[editor][platform]?.(projectPath);
      if (!launchCommand) {
        continue;
      }

      if (!(await isEditorInstalled(editor))) {
        continue;
      }

      candidates.push({ editor, command: launchCommand.command, args: launchCommand.args });
    }

    return candidates;
  };

  return {
    checkEditorInstalled: async (editorName: string) => {
      const parsed = parseEditorName(editorName);
      if (!parsed) {
        return false;
      }

      return await isEditorInstalled(parsed);
    },
    openProject: async (editorName: string, projectPath: string): Promise<OpenProjectInEditorResult> => {
      const preferredEditor = parseEditorName(editorName);
      if (!preferredEditor) {
        return { success: false, error: `Editor ${editorName} is not supported.` };
      }

      const availableEditors = await resolveAvailableEditors(preferredEditor, projectPath);
      if (availableEditors.length === 0) {
        return {
          success: false,
          error: "No supported editor installation found. Install Cursor or Visual Studio Code.",
        };
      }

      let lastError: string | undefined;
      for (const { editor, command, args } of availableEditors) {
        try {
          await execFileAsync(command, args);
          return {
            success: true,
            usedEditor: editor,
            fallbackApplied: editor !== preferredEditor,
          };
        } catch (error) {
          logError(`Failed to open ${editor} for ${projectPath}:`, error);
          lastError = getFriendlyEditorLaunchError(editor, error);
        }
      }

      return {
        success: false,
        error: lastError ?? `Unable to launch ${preferredEditor}.`,
      };
    },
  };
};
