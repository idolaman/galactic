import path from "node:path";
import type { EditorLaunchCommand, SupportedEditorName } from "./types.js";

type EditorLaunchResolver = (projectPath: string) => EditorLaunchCommand;

export const supportedEditors: SupportedEditorName[] = ["Cursor", "VSCode"];

export const editorCandidateOrder: Record<SupportedEditorName, SupportedEditorName[]> = {
  Cursor: ["Cursor", "VSCode"],
  VSCode: ["VSCode", "Cursor"],
};

export const editorApplicationNames: Record<SupportedEditorName, string> = {
  Cursor: "Cursor",
  VSCode: "Visual Studio Code",
};

export const editorCliCommands: Record<SupportedEditorName, string> = {
  Cursor: "cursor",
  VSCode: "code",
};

export const getEditorBundlePaths = (homeDirectory: string): Record<SupportedEditorName, string[]> => {
  return {
    Cursor: [
      "/Applications/Cursor.app",
      path.join(homeDirectory, "Applications", "Cursor.app"),
    ],
    VSCode: [
      "/Applications/Visual Studio Code.app",
      path.join(homeDirectory, "Applications", "Visual Studio Code.app"),
    ],
  };
};

export const editorLaunchCommands: Record<
  SupportedEditorName,
  Partial<Record<NodeJS.Platform, EditorLaunchResolver>>
> = {
  Cursor: {
    darwin: (projectPath) => ({
      command: "open",
      args: ["-a", editorApplicationNames.Cursor, projectPath],
    }),
    win32: (projectPath) => ({ command: editorCliCommands.Cursor, args: [projectPath] }),
    linux: (projectPath) => ({ command: editorCliCommands.Cursor, args: [projectPath] }),
  },
  VSCode: {
    darwin: (projectPath) => ({
      command: "open",
      args: ["-a", editorApplicationNames.VSCode, projectPath],
    }),
    win32: (projectPath) => ({ command: editorCliCommands.VSCode, args: [projectPath] }),
    linux: (projectPath) => ({ command: editorCliCommands.VSCode, args: [projectPath] }),
  },
};
