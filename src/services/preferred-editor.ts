import type { EditorName } from "@/services/editor";

const PREFERRED_EDITOR_KEY = "preferredEditor";

const parsePreferredEditor = (value: string | null): EditorName => {
  return value === "VSCode" ? "VSCode" : "Cursor";
};

export const preferredEditorStorage = {
  load(): EditorName {
    if (typeof window === "undefined") {
      return "Cursor";
    }

    try {
      return parsePreferredEditor(window.localStorage.getItem(PREFERRED_EDITOR_KEY));
    } catch {
      return "Cursor";
    }
  },
  save(editor: EditorName): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(PREFERRED_EDITOR_KEY, editor);
    } catch (error) {
      console.warn("Failed to persist preferred editor:", error);
    }
  },
};
