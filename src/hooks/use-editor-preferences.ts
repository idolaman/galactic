import { useEffect, useState } from "react";
import { loadPreferredEditor, savePreferredEditor } from "@/services/editor-preference";
import type { EditorName } from "@/services/editor";

interface EditorInstallState {
  Cursor: boolean;
  VSCode: boolean;
}

export const useEditorPreferences = () => {
  const [preferredEditor, setPreferredEditor] = useState<EditorName>(loadPreferredEditor);
  const [installedEditors, setInstalledEditors] = useState<EditorInstallState>({ Cursor: false, VSCode: false });

  useEffect(() => {
    savePreferredEditor(preferredEditor);
  }, [preferredEditor]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const [cursorInstalled, vscodeInstalled] = await Promise.all([
        window.electronAPI?.checkEditorInstalled?.("Cursor") ?? false,
        window.electronAPI?.checkEditorInstalled?.("VSCode") ?? false,
      ]);

      if (!active) {
        return;
      }

      setInstalledEditors({ Cursor: cursorInstalled, VSCode: vscodeInstalled });
      setPreferredEditor((current) => {
        if (cursorInstalled && !vscodeInstalled) {
          return "Cursor";
        }
        if (vscodeInstalled && !cursorInstalled) {
          return "VSCode";
        }
        return current;
      });
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  return {
    installedEditors,
    preferredEditor,
    setPreferredEditor,
  };
};
