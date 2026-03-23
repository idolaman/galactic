export const MCP_TOOL_NAMES = ["Cursor", "VSCode", "Claude", "Codex"] as const;

export type McpToolName = (typeof MCP_TOOL_NAMES)[number];

interface McpInstallationSection {
  label: string;
  value: string;
}

export interface McpInstallationDetails {
  description: string;
  sections: McpInstallationSection[];
}

const JSON_MCP_CONFIG = `"galactic": {
  "type": "http",
  "url": "http://localhost:17890"
}`;

const MCP_DETAILS_BY_TOOL: Record<McpToolName, McpInstallationDetails> = {
  Cursor: {
    description: "Galactic injects the following configuration into your agent's settings file.",
    sections: [
      { label: "Target File", value: "~/.cursor/mcp.json" },
      { label: "Injected Config", value: JSON_MCP_CONFIG },
    ],
  },
  VSCode: {
    description: "Galactic injects the following configuration into your agent's settings file.",
    sections: [
      { label: "Target File", value: "~/Library/Application Support/Code/User/mcp.json" },
      { label: "Injected Config", value: JSON_MCP_CONFIG },
    ],
  },
  Claude: {
    description: "Galactic uses Claude Code CLI commands to add and verify the MCP server.",
    sections: [
      { label: "Install Command", value: "claude mcp add --transport http --scope user galactic http://localhost:17890" },
    ],
  },
  Codex: {
    description: "Galactic injects the following configuration into your agent's settings file.",
    sections: [
      { label: "Target File", value: "~/.codex/config.toml" },
      {
        label: "Injected Config",
        value: `[mcp_servers.galactic]
type = "http"
url = "http://localhost:17890"`,
      },
    ],
  },
};

export const getMcpInstallationDetails = (tool: McpToolName): McpInstallationDetails => {
  return MCP_DETAILS_BY_TOOL[tool];
};
