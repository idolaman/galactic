import { Code2, Info } from "lucide-react";

import { SettingRow } from "@/components/Settings/SettingRow";
import { SettingsSection } from "@/components/Settings/SettingsSection";
import { SettingsStatusBadge } from "@/components/Settings/SettingsStatusBadge";
import { McpToolIcon } from "@/components/Settings/McpToolIcon";
import { Button } from "@/components/ui/button";
import { MCP_INSTALL_NOTE } from "@/lib/mcp-installation";
import { MCP_TOOL_NAMES, type McpToolName } from "@/lib/mcp-installation-details";

interface McpIntegrationsSettingsProps {
  installed: Record<McpToolName, boolean>;
  installing: Partial<Record<McpToolName, boolean>>;
  onDetails: (tool: McpToolName) => void;
  onInstall: (tool: McpToolName) => Promise<void>;
}

const labelByTool: Record<McpToolName, string> = {
  Claude: "Claude Code",
  Codex: "Codex",
  Cursor: "Cursor",
  VSCode: "VS Code",
};

const descriptionByTool: Record<McpToolName, string> = {
  Claude: "Install Galactic MCP through the Claude CLI.",
  Codex: "Install the Galactic server in Codex configuration.",
  Cursor: "Install the Galactic server in Cursor MCP settings.",
  VSCode: "Install the Galactic server in VS Code MCP settings.",
};

export function McpIntegrationsSettings({
  installed,
  installing,
  onDetails,
  onInstall,
}: McpIntegrationsSettingsProps) {
  return (
    <SettingsSection
      id="mcp-installation"
      title="MCP Integrations"
      description="Connect coding agents to Galactic session and workspace context."
    >
      {MCP_TOOL_NAMES.map((tool) => {
        const isInstalled = installed[tool];
        const isInstalling = Boolean(installing[tool]);

        return (
          <SettingRow
            key={tool}
            label={labelByTool[tool]}
            description={descriptionByTool[tool]}
            media={(
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-muted/40">
                <McpToolIcon tool={tool} />
              </div>
            )}
          >
            <div className="flex items-center gap-2">
              <SettingsStatusBadge tone={isInstalled ? "success" : "muted"}>
                {isInstalled ? "Installed" : "Installable"}
              </SettingsStatusBadge>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDetails(tool)}>
                <Info className="h-4 w-4" />
              </Button>
              <Button
                variant={isInstalled ? "outline" : "secondary"}
                size="sm"
                disabled={isInstalled || isInstalling}
                onClick={() => void onInstall(tool)}
              >
                {isInstalled ? "Installed" : isInstalling ? "Installing..." : "Install"}
              </Button>
            </div>
          </SettingRow>
        );
      })}
      <div className="flex items-start gap-2 px-4 py-3 text-xs text-muted-foreground">
        <Code2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        <p>{MCP_INSTALL_NOTE}</p>
      </div>
    </SettingsSection>
  );
}
