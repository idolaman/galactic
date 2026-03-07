import { promises as fs } from "node:fs";
import path from "node:path";
import { getClaudeMarketplaceRoot } from "../paths.js";

const marketplaceName = "galactic-ide";
const pluginName = "galactic-ide-hooks";

export const claudePluginId = `${pluginName}@${marketplaceName}`;
export const claudeMarketplaceName = marketplaceName;

export const writeClaudeMarketplace = async (commandPath: string, homeDirectory?: string) => {
  const root = getClaudeMarketplaceRoot(homeDirectory);
  const manifestPath = path.join(root, ".claude-plugin", "marketplace.json");
  const pluginRoot = path.join(root, "plugins", pluginName);
  const manifest = {
    name: marketplaceName,
    owner: { name: "Galactic Dev" },
    plugins: [
      {
        name: pluginName,
        source: `./plugins/${pluginName}`,
        strict: false,
        description: "Galactic IDE lifecycle hooks",
        hooks: {
          SessionStart: [{ hooks: [{ type: "command", command: `"${commandPath}" claude` }] }],
          UserPromptSubmit: [{ hooks: [{ type: "command", command: `"${commandPath}" claude` }] }],
          PermissionRequest: [{ hooks: [{ type: "command", command: `"${commandPath}" claude` }] }],
          PostToolUse: [{ hooks: [{ type: "command", command: `"${commandPath}" claude` }] }],
          PostToolUseFailure: [{ hooks: [{ type: "command", command: `"${commandPath}" claude` }] }],
          Stop: [{ hooks: [{ type: "command", command: `"${commandPath}" claude` }] }],
          SessionEnd: [{ hooks: [{ type: "command", command: `"${commandPath}" claude` }] }],
        },
      },
    ],
  };

  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.mkdir(pluginRoot, { recursive: true });
  await fs.writeFile(path.join(pluginRoot, "README.md"), "# Galactic IDE Hooks\n", "utf8");
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  return root;
};
