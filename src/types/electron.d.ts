export {};

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
      openProjectInEditor: (editorName: string, projectPath: string) => Promise<{ success: boolean; error?: string }>;
    };
  }
}
