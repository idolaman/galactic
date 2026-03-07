import type { EditorName } from "@/services/editor";

const storageKey = "galactic-ide:preferred-editor";

export const loadPreferredEditor = (): EditorName => {
  if (typeof window === "undefined") {
    return "Cursor";
  }

  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored === "VSCode" ? "VSCode" : "Cursor";
  } catch {
    return "Cursor";
  }
};

export const savePreferredEditor = (editor: EditorName): void => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, editor);
  } catch (error) {
    console.warn("Failed to persist preferred editor:", error);
  }
};
