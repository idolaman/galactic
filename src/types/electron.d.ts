export {};

declare global {
  interface Window {
    electronAPI: {
      ping: () => Promise<string>;
      checkEditorInstalled: (editorName: string) => Promise<boolean>;
    };
  }
}

