import { useCallback, useEffect, useState } from "react";

import {
  getPreferredEditor,
  setPreferredEditorPreference,
  type EditorName,
} from "@/services/editor";
import { trackSettingsEditorChanged } from "@/services/analytics";

export type EditorInstallState = Record<EditorName, boolean>;

export interface SettingsEditorPreferenceState {
  installed: EditorInstallState;
  onEditorChange: (value: string) => void;
  preferredEditor: EditorName;
}

export const useSettingsEditorPreference = (): SettingsEditorPreferenceState => {
  const [preferredEditor, setPreferredEditor] = useState<EditorName>(() => getPreferredEditor());
  const [installed, setInstalled] = useState<EditorInstallState>({
    Cursor: false,
    VSCode: false,
  });

  const checkEditors = useCallback(async () => {
    if (!window.electronAPI?.checkEditorInstalled) {
      return;
    }

    const cursorInstalled = await window.electronAPI.checkEditorInstalled("Cursor");
    const vscodeInstalled = await window.electronAPI.checkEditorInstalled("VSCode");
    setInstalled({ Cursor: cursorInstalled, VSCode: vscodeInstalled });
    setPreferredEditor((current) => {
      if (cursorInstalled && !vscodeInstalled) {
        return "Cursor";
      }

      if (vscodeInstalled && !cursorInstalled) {
        return "VSCode";
      }

      return current;
    });
  }, []);

  useEffect(() => {
    void checkEditors();
  }, [checkEditors]);

  useEffect(() => {
    setPreferredEditorPreference(preferredEditor);
  }, [preferredEditor]);

  const handleEditorChange = (value: string) => {
    const nextValue: EditorName = value === "VSCode" ? "VSCode" : "Cursor";
    setPreferredEditor(nextValue);
    trackSettingsEditorChanged(nextValue);
  };

  return {
    installed,
    onEditorChange: handleEditorChange,
    preferredEditor,
  };
};
