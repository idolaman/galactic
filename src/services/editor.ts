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
  if (typeof window === "undefined") return "Cursor";
  const stored = window.localStorage.getItem("preferredEditor");
  return stored === "VSCode" ? "VSCode" : "Cursor";
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
      try {
        window.localStorage.setItem("preferredEditor", result.usedEditor);
      } catch (error) {
        console.warn("Failed to persist fallback editor preference:", error);
      }
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
