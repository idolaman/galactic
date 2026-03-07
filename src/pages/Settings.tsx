import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useEditorPreferences } from "@/hooks/use-editor-preferences";
import { useHookPlatforms } from "@/hooks/use-hook-platforms";
import { useQuickSidebarHotkey } from "@/hooks/use-quick-sidebar-hotkey";
import { useSettingsScroll } from "@/hooks/use-settings-scroll";
import { useUpdate } from "@/hooks/use-update";
import { EditorSettingsCard } from "@/components/settings/EditorSettingsCard";
import { HookInstallationSection } from "@/components/settings/HookInstallationSection";
import { HotkeySettingsCard } from "@/components/settings/HotkeySettingsCard";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { UpdateSettingsCard } from "@/components/settings/UpdateSettingsCard";

export default function Settings() {
  const { toast } = useToast();
  const { state: updateState, checkForUpdates, installUpdate } = useUpdate();
  const { highlightHotkey } = useSettingsScroll();
  const { installedEditors, preferredEditor, setPreferredEditor } = useEditorPreferences();
  const hotkey = useQuickSidebarHotkey(toast);
  const hooks = useHookPlatforms(toast);
  const [appVersion, setAppVersion] = useState<string | null>(null);

  useEffect(() => {
    void window.electronAPI?.getAppVersion?.().then(setAppVersion);
  }, []);

  return (
    <div className="space-y-8 p-6">
      <SettingsHeader />
      <EditorSettingsCard
        installedEditors={installedEditors}
        preferredEditor={preferredEditor}
        setPreferredEditor={setPreferredEditor}
      />
      <HotkeySettingsCard
        enabled={hotkey.enabled}
        highlight={highlightHotkey}
        loading={hotkey.loading}
        onChange={(enabled) => void hotkey.setEnabled(enabled)}
        saving={hotkey.saving}
      />
      <HookInstallationSection {...hooks} />
      <UpdateSettingsCard
        appVersion={appVersion}
        checkForUpdates={checkForUpdates}
        installUpdate={installUpdate}
        updateState={updateState}
      />
    </div>
  );
}
