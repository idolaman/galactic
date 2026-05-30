import { useCallback, useEffect, useState } from "react";

import { useAppToast } from "@/hooks/use-app-toast";
import { useDialogExitSnapshot } from "@/hooks/use-dialog-exit-snapshot";
import { handleMcpInstallResult } from "@/lib/mcp-installation";
import { MCP_TOOL_NAMES, type McpToolName } from "@/lib/mcp-installation-details";
import { trackSettingsMcpInstalled } from "@/services/analytics";

export interface SettingsMcpInstallationState {
  handleConfigDialogExitComplete: () => void;
  installed: Record<McpToolName, boolean>;
  installing: Partial<Record<McpToolName, boolean>>;
  onInstall: (tool: McpToolName) => Promise<void>;
  selectedConfig: McpToolName | null;
  selectedConfigSnapshot: McpToolName | null;
  setSelectedConfig: (tool: McpToolName | null) => void;
}

const defaultInstalled: Record<McpToolName, boolean> = {
  Claude: false,
  Codex: false,
  Cursor: false,
  VSCode: false,
};

export const useSettingsMcpInstallation = (): SettingsMcpInstallationState => {
  const toast = useAppToast();
  const { error: showError } = toast;
  const [installed, setInstalled] = useState<Record<McpToolName, boolean>>(defaultInstalled);
  const [installing, setInstalling] = useState<Partial<Record<McpToolName, boolean>>>({});
  const [selectedConfig, setSelectedConfig] = useState<McpToolName | null>(null);
  const {
    snapshot: selectedConfigSnapshot,
    handleExitComplete: handleConfigDialogExitComplete,
  } = useDialogExitSnapshot(selectedConfig);

  const checkMcpStatus = useCallback(async () => {
    if (!window.electronAPI?.checkMcpInstalled) {
      return;
    }

    const status = {} as Record<McpToolName, boolean>;
    for (const tool of MCP_TOOL_NAMES) {
      status[tool] = await window.electronAPI.checkMcpInstalled(tool);
    }
    setInstalled(status);
  }, []);

  useEffect(() => {
    void checkMcpStatus();
  }, [checkMcpStatus]);

  const handleInstall = async (tool: McpToolName) => {
    if (!window.electronAPI?.installMcp) return;

    setInstalling((prev) => ({ ...prev, [tool]: true }));
    try {
      const result = await window.electronAPI.installMcp(tool);
      await handleMcpInstallResult({ result, refreshStatus: checkMcpStatus, toast, tool });
      if (result.success) {
        trackSettingsMcpInstalled(tool);
      }
    } catch (_caughtError) {
      showError({ title: "Error", description: "An unexpected error occurred." });
    } finally {
      setInstalling((prev) => ({ ...prev, [tool]: false }));
    }
  };

  return {
    handleConfigDialogExitComplete,
    installed,
    installing,
    onInstall: handleInstall,
    selectedConfig,
    selectedConfigSnapshot,
    setSelectedConfig,
  };
};
