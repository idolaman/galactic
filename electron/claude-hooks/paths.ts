import os from "node:os";
import path from "node:path";

export const CLAUDE_MARKETPLACE_NAME = "galactic-ide";
export const CLAUDE_PLUGIN_NAME = "galactic-ide-hooks";
export const CLAUDE_PLUGIN_ID = `${CLAUDE_PLUGIN_NAME}@${CLAUDE_MARKETPLACE_NAME}`;

export interface ClaudeHookPaths {
  installStatePath: string;
  claudePluginStatePath: string;
  claudeMarketplaceStatePath: string;
  marketplaceRoot: string;
  marketplaceManifestPath: string;
  pluginRoot: string;
  pluginReadmePath: string;
  runnerPath: string;
  eventLogPath: string;
  activeRunsPath: string;
}

export const getClaudeHookPaths = (homeDir: string = os.homedir()): ClaudeHookPaths => {
  const galacticRoot = path.join(homeDir, ".galactic", "platforms", "claude");
  const marketplaceRoot = path.join(galacticRoot, "marketplace");

  return {
    installStatePath: path.join(galacticRoot, "state", "install-state.json"),
    claudePluginStatePath: path.join(homeDir, ".claude", "plugins", "installed_plugins.json"),
    claudeMarketplaceStatePath: path.join(homeDir, ".claude", "plugins", "known_marketplaces.json"),
    marketplaceRoot,
    marketplaceManifestPath: path.join(marketplaceRoot, ".claude-plugin", "marketplace.json"),
    pluginRoot: path.join(marketplaceRoot, "plugins", CLAUDE_PLUGIN_NAME),
    pluginReadmePath: path.join(marketplaceRoot, "plugins", CLAUDE_PLUGIN_NAME, "README.md"),
    runnerPath: path.join(galacticRoot, "bin", "galactic-claude-hook.mjs"),
    eventLogPath: path.join(galacticRoot, "state", "agent-events.ndjson"),
    activeRunsPath: path.join(galacticRoot, "state", "active-runs.json"),
  };
};
