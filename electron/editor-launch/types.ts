export type SupportedEditorName = "Cursor" | "VSCode";

export interface EditorLaunchCommand {
  command: string;
  args: string[];
}

export interface OpenProjectInEditorResult {
  success: boolean;
  error?: string;
  usedEditor?: SupportedEditorName;
  fallbackApplied?: boolean;
}

export interface EditorLaunchService {
  checkEditorInstalled: (editorName: string) => Promise<boolean>;
  openProject: (
    editorName: string,
    projectPath: string,
  ) => Promise<OpenProjectInEditorResult>;
}

export interface EditorLaunchServiceDeps {
  platform?: NodeJS.Platform;
  homeDirectory?: string;
  pathExists?: (filePath: string) => boolean;
  execFileAsync?: (command: string, args: string[]) => Promise<unknown>;
  logError?: (message: string, error: unknown) => void;
}
