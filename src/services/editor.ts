import { GLOBAL_LOCAL_STORAGE_KEYS } from "@/services/local-storage-keys";
import { getLocalStorage } from "@/services/local-storage-scope";

export type EditorName = "Cursor" | "VSCode";

export interface OpenEditorResult {
  error?: string;
  fallbackApplied?: boolean;
  success: boolean;
  usedEditor?: EditorName;
}

const isEditorName = (value: string): value is EditorName => {
  return value === "Cursor" || value === "VSCode";
};

export const getPreferredEditor = (): EditorName => {
  const storage = getLocalStorage();
  if (!storage) return "Cursor";

  try {
    return storage.getItem(GLOBAL_LOCAL_STORAGE_KEYS.preferredEditor) === "VSCode"
      ? "VSCode"
      : "Cursor";
  } catch {
    return "Cursor";
  }
};

export const setPreferredEditorPreference = (editor: EditorName): void => {
  const storage = getLocalStorage();
  if (!storage) return;

  try {
    storage.setItem(GLOBAL_LOCAL_STORAGE_KEYS.preferredEditor, editor);
  } catch (error) {
    console.warn("Failed to persist editor preference:", error);
  }
};

export const openProjectInEditor = async (
  editor: EditorName,
  projectPath: string,
): Promise<OpenEditorResult> => {
  if (typeof window === "undefined") {
    return { success: false, error: "Renderer is not available." };
  }

  try {
    const result =
      (await window.electronAPI?.openProjectInEditor?.(editor, projectPath)) ?? null;
    if (result?.success && result.fallbackApplied && result.usedEditor && isEditorName(result.usedEditor)) {
      setPreferredEditorPreference(result.usedEditor);
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
