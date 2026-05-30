import { AsyncToggleSettingCard } from "@/components/Settings/AsyncToggleSettingCard";
import { EventNotificationsSettingCard } from "@/components/Settings/EventNotificationsSettingCard";
import { McpConfigDetailsDialog } from "@/components/Settings/McpConfigDetailsDialog";
import { McpIntegrationsSettings } from "@/components/Settings/McpIntegrationsSettings";
import { PreferredEditorSettings } from "@/components/Settings/PreferredEditorSettings";
import { SettingsPageShell } from "@/components/Settings/SettingsPageShell";
import { UpdatesSettingSection } from "@/components/Settings/UpdatesSettingSection";
import { WorkspaceIsolationShellHooksSettingCard } from "@/components/Settings/WorkspaceIsolationShellHooksSettingCard";
import { useSettingsEditorPreference } from "@/hooks/use-settings-editor-preference";
import { useSettingsHotkeyHighlight } from "@/hooks/use-settings-hotkey-highlight";
import { useSettingsMcpInstallation } from "@/hooks/use-settings-mcp-installation";
import { cn } from "@/lib/utils";

export default function Settings() {
  const editor = useSettingsEditorPreference();
  const mcp = useSettingsMcpInstallation();
  const highlightHotkey = useSettingsHotkeyHighlight();

  return (
    <SettingsPageShell>
      <PreferredEditorSettings
        installed={editor.installed}
        onEditorChange={editor.onEditorChange}
        preferredEditor={editor.preferredEditor}
      />
      <EventNotificationsSettingCard />
      <WorkspaceIsolationShellHooksSettingCard />
      <AsyncToggleSettingCard
        cardId="global-hotkey"
        title="Quick Launcher"
        description="Enable the system shortcut for opening projects and workspaces."
        label="Global hotkey"
        details={(
          <p>
            Press{" "}
            <kbd className="inline-flex h-5 items-center rounded border bg-muted px-1.5 font-sans text-[11px] text-foreground">
              Cmd+Shift+G
            </kbd>{" "}
            to toggle the Quick Launcher.
          </p>
        )}
        switchId="quick-sidebar-hotkey"
        getValue={window.electronAPI?.getQuickSidebarHotkeyEnabled}
        setValue={window.electronAPI?.setQuickSidebarHotkeyEnabled}
        loadErrorTitle="Hotkey setting unavailable"
        loadErrorDescription="Unable to load the global hotkey preference."
        saveErrorTitle="Hotkey update failed"
        saveErrorDescription="Unable to update the global hotkey."
        switchClassName={cn(highlightHotkey && "ring-2 ring-primary ring-offset-2 ring-offset-background")}
      />
      <McpIntegrationsSettings
        installed={mcp.installed}
        installing={mcp.installing}
        onDetails={mcp.setSelectedConfig}
        onInstall={mcp.onInstall}
      />
      <UpdatesSettingSection />
      <McpConfigDetailsDialog
        openTool={mcp.selectedConfig}
        snapshotTool={mcp.selectedConfigSnapshot}
        onOpenChange={mcp.setSelectedConfig}
        onExitComplete={mcp.handleConfigDialogExitComplete}
      />
    </SettingsPageShell>
  );
}
