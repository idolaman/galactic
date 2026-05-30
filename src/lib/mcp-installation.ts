import { type McpToolName } from "./mcp-installation-details.js";

export interface McpInstallResult {
  success: boolean;
  error?: string;
}

export interface McpInstallToast {
  title: string;
  description: string;
}

interface HandleMcpInstallResultOptions {
  result: McpInstallResult;
  refreshStatus: () => Promise<void>;
  toast: { error: (options: McpInstallToast) => unknown };
  tool: McpToolName;
}

export const MCP_INSTALL_NOTE = "After installing Galactic MCP, restart your coding agent so it can load the new connection.";

export const handleMcpInstallResult = async ({
  result,
  refreshStatus,
  toast,
  tool,
}: HandleMcpInstallResultOptions): Promise<void> => {
  if (result.success) {
    await refreshStatus();
    return;
  }

  toast.error({
    title: "Installation Failed",
    description: result.error ?? `Failed to install MCP for ${tool}.`,
  });
};
