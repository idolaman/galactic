import { preferredEditorStorage } from "@/services/preferred-editor";

export type EditorName = "Cursor" | "VSCode";

export interface OpenEditorResult {
  success: boolean;
  error?: string;
  usedEditor?: EditorName;
  fallbackApplied?: boolean;
}

const isEditorName = (value: string): value is EditorName => {
  return value === "Cursor" || value === "VSCode";
};

export const getPreferredEditor = (): EditorName => {
  return preferredEditorStorage.load();
};

export const openProjectInEditor = async (
  editor: EditorName,
  projectPath: string
): Promise<OpenEditorResult> => {
  if (typeof window === "undefined") {
    return { success: false, error: "Renderer is not available." };
  }

  try {
    const result =
      (await window.electronAPI?.openProjectInEditor?.(editor, projectPath)) ?? null;
    if (result?.success && result.fallbackApplied && result.usedEditor && isEditorName(result.usedEditor)) {
      preferredEditorStorage.save(result.usedEditor);
    }
    return result ?? { success: false, error: "Open in editor is unavailable." };
  } catch (error) {
    console.error("Failed to open project in editor:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
