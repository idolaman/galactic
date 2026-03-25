import os from "node:os";
import path from "node:path";
import type { IpcMain } from "electron";
import { checkClaudeMcpInstalled, installClaudeMcp, type ClaudeMcpInstallResult } from "../utils/claude-mcp.js";
import { checkMcpConfig, updateMcpConfig } from "../utils/config.js";

export const MCP_SERVER_PORT = 17890;

const MCP_SERVER_NAME = "galactic";
const MCP_SERVER_CONFIG = {
  type: "http",
  url: `http://localhost:${MCP_SERVER_PORT}`,
} as const;

interface McpIpcDeps {
  ipcMain: Pick<IpcMain, "handle">;
  mcpConnected: (tool: string) => void;
  checkClaudeInstalled?: () => Promise<boolean>;
  checkConfig?: typeof checkMcpConfig;
  homeDir?: string;
  installClaude?: () => Promise<ClaudeMcpInstallResult>;
  updateConfig?: typeof updateMcpConfig;
}

const getConfigPath = (tool: string, homeDir: string): string | null => {
  if (tool === "Cursor") {
    return path.join(homeDir, ".cursor", "mcp.json");
  }

  if (tool === "VSCode") {
    return path.join(homeDir, "Library", "Application Support", "Code", "User", "mcp.json");
  }

  if (tool === "Codex") {
    return path.join(homeDir, ".codex", "config.toml");
  }

  return null;
};

export const registerMcpIpc = ({
  ipcMain,
  mcpConnected,
  checkClaudeInstalled = checkClaudeMcpInstalled,
  checkConfig = checkMcpConfig,
  homeDir = os.homedir(),
  installClaude = installClaudeMcp,
  updateConfig = updateMcpConfig,
}: McpIpcDeps): void => {
  ipcMain.handle("mcp/check-installed", async (_event, tool: string) => {
    if (tool === "Claude") {
      return await checkClaudeInstalled();
    }

    const configPath = getConfigPath(tool, homeDir);
    if (!configPath) {
      return false;
    }

    return await checkConfig(configPath, MCP_SERVER_NAME);
  });

  ipcMain.handle("mcp/install", async (_event, tool: string): Promise<ClaudeMcpInstallResult> => {
    let result: ClaudeMcpInstallResult;

    if (tool === "Claude") {
      result = await installClaude();
    } else {
      const configPath = getConfigPath(tool, homeDir);
      if (!configPath) {
        return { success: false, error: "Tool not supported yet." };
      }

      result = await updateConfig(configPath, MCP_SERVER_NAME, MCP_SERVER_CONFIG);
    }

    if (result.success) {
      mcpConnected(tool);
    }

    return result;
  });
};
