export {};

export interface WorkspaceEnvConfig {
  hostVariable?: string;
  address?: string;
}

declare global {
  interface Window {
    electronAPI: {
      ping: () => Promise<string>;
      checkEditorInstalled: (editorName: string) => Promise<boolean>;
      listApplications: () => Promise<Array<{ name: string; path: string }>>;
      browseApplication: () => Promise<string | null>;
      openApplicationsFolder: () => Promise<boolean>;
      chooseProjectDirectory: () => Promise<string | null>;
      getGitInfo: (projectPath: string) => Promise<{ isGitRepo: boolean; currentBranch?: string | null }>;
      listGitBranches: (projectPath: string) => Promise<string[]>;
      createGitWorktree: (
        projectPath: string,
        branch: string,
      ) => Promise<{ success: boolean; path?: string; error?: string }>;
      removeGitWorktree: (
        projectPath: string,
        worktreePath: string,
      ) => Promise<{ success: boolean; error?: string }>;
      openProjectInEditor: (editorName: string, projectPath: string) => Promise<{ success: boolean; error?: string }>;
      searchProjectFiles: (projectPath: string, query: string) => Promise<string[]>;
      copyProjectFilesToWorktree: (
        projectPath: string,
        worktreePath: string,
        files: string[],
      ) => Promise<{
        success: boolean;
        copied: string[];
        errors?: Array<{ file: string; message: string }>;
      }>;
      configureEnvironmentInterface: (
        action: "add" | "remove",
        address: string,
      ) => Promise<{ success: boolean; output?: string; error?: string }>;
      writeCodeWorkspace: (
        targetPath: string,
        envConfig: WorkspaceEnvConfig | null,
      ) => Promise<{ success: boolean; workspacePath?: string; error?: string }>;
      getCodeWorkspacePath: (
        targetPath: string,
      ) => Promise<{ exists: boolean; workspacePath: string }>;
    };
  }
}
