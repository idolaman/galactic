import os from "node:os";
import path from "node:path";
import type { HookInstallStatus } from "./claude-hooks/service.js";
import { checkMcpConfig, updateMcpConfig } from "./utils/config.js";

export type HookId = "claude";
export type McpTool = "Cursor" | "VSCode" | "Claude" | "Codex";

interface ClaudeHooksService {
  getStatus: () => Promise<HookInstallStatus>;
  install: () => Promise<{ success: boolean; error?: string }>;
  isInstalled: () => Promise<boolean>;
}

interface AgentIntegrationsServiceOptions {
  claudeHooksService: ClaudeHooksService;
  homeDir?: string;
  onConnected?: (tool: McpTool) => void;
}

const MCP_SERVER_PORT = 17890;
const MCP_SERVER_NAME = "galactic";
const THINKING_LOGGER_CONFIG = {
  type: "http",
  url: `http://localhost:${MCP_SERVER_PORT}`,
} as const;

const getMcpConfigPath = (homeDir: string, tool: McpTool): string => {
  const paths: Record<McpTool, string> = {
    Cursor: path.join(homeDir, ".cursor", "mcp.json"),
    VSCode: path.join(homeDir, "Library", "Application Support", "Code", "User", "mcp.json"),
    Claude: path.join(homeDir, ".claude.json"),
    Codex: path.join(homeDir, ".codex", "config.toml"),
  };
  return paths[tool];
};

export const createAgentIntegrationsService = ({
  claudeHooksService,
  homeDir = os.homedir(),
  onConnected,
}: AgentIntegrationsServiceOptions) => {
  const trackConnected = (tool: McpTool) => {
    onConnected?.(tool);
  };

  const checkMcpInstalled = async (tool: McpTool): Promise<boolean> => {
    return checkMcpConfig(getMcpConfigPath(homeDir, tool), MCP_SERVER_NAME);
  };

  const installMcp = async (tool: McpTool): Promise<{ success: boolean; error?: string }> => {
    const result = await updateMcpConfig(
      getMcpConfigPath(homeDir, tool),
      MCP_SERVER_NAME,
      THINKING_LOGGER_CONFIG,
    );
    if (result.success) {
      trackConnected(tool);
    }
    return result;
  };

  const checkClaudeHooksInstalled = async (): Promise<boolean> => {
    return claudeHooksService.isInstalled();
  };

  const getHookStatuses = async (): Promise<Record<HookId, HookInstallStatus>> => {
    return { claude: await claudeHooksService.getStatus() };
  };

  const installClaudeHooks = async (): Promise<{ success: boolean; error?: string }> => {
    const result = await claudeHooksService.install();
    if (result.success) {
      trackConnected("Claude");
    }
    return result;
  };

  const installHook = async (hookId: HookId): Promise<{ success: boolean; error?: string }> => {
    if (hookId === "claude") {
      return installClaudeHooks();
    }
    return { success: false, error: "Hook not supported yet." };
  };

  return {
    checkClaudeHooksInstalled,
    checkMcpInstalled,
    getHookStatuses,
    installHook,
    installClaudeHooks,
    installMcp,
  };
};
