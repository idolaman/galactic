import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { ensureHookRunnerInstalled } from "../assets.js";
import { updateHookInstallRecord } from "../manifest.js";
import type { HookInstallResult, HookPlatformStatus } from "../types.js";
import { claudeMarketplaceName, claudePluginId, writeClaudeMarketplace } from "./claude-assets.js";

const execFileAsync = promisify(execFile);

const manualSteps = [
  "Run `claude plugin marketplace add --scope user <~/.galactic/platforms/claude/marketplace>`.",
  `Run \`claude plugin install --scope user ${claudePluginId}\`.`,
];

const listInstalledPlugins = async () => {
  const { stdout } = await execFileAsync("claude", ["plugin", "list", "--json"]);
  return JSON.parse(stdout) as Array<{ id: string }>;
};

const listMarketplaces = async () => {
  const { stdout } = await execFileAsync("claude", ["plugin", "marketplace", "list", "--json"]);
  return JSON.parse(stdout) as Array<{ name: string }>;
};

export const getClaudeStatus = async (): Promise<HookPlatformStatus> => {
  try {
    const plugins = await listInstalledPlugins();
    const installed = plugins.some((plugin) => plugin.id === claudePluginId);
    return {
      platform: "Claude",
      supported: true,
      available: true,
      installed,
      mode: "automatic",
      requiresManual: false,
      summary: installed ? "Claude plugin installed." : "Ready to install via Claude CLI.",
    };
  } catch (error) {
    return {
      platform: "Claude",
      supported: false,
      available: false,
      installed: false,
      mode: "automatic",
      requiresManual: true,
      summary: "Claude CLI is unavailable.",
      reason: error instanceof Error ? error.message : "Claude CLI not found.",
      manualSteps,
    };
  }
};

export const installClaudeHooks = async (homeDirectory?: string): Promise<HookInstallResult> => {
  try {
    const plugins = await listInstalledPlugins();
    if (plugins.some((plugin) => plugin.id === claudePluginId)) {
      await updateHookInstallRecord("Claude", { installedAt: new Date().toISOString(), mode: "automatic" }, homeDirectory);
      return { success: true, platform: "Claude", installed: true, mode: "automatic" };
    }

    const commandPath = await ensureHookRunnerInstalled(homeDirectory);
    const marketplaceRoot = await writeClaudeMarketplace(commandPath, homeDirectory);
    const marketplaces = await listMarketplaces();
    if (!marketplaces.some((marketplace) => marketplace.name === claudeMarketplaceName)) {
      await execFileAsync("claude", ["plugin", "marketplace", "add", "--scope", "user", marketplaceRoot]);
    }
    await execFileAsync("claude", ["plugin", "install", "--scope", "user", claudePluginId]);
    await updateHookInstallRecord("Claude", { installedAt: new Date().toISOString(), mode: "automatic" }, homeDirectory);
    return { success: true, platform: "Claude", installed: true, mode: "automatic" };
  } catch (error) {
    return {
      success: false,
      platform: "Claude",
      installed: false,
      mode: "automatic",
      error: error instanceof Error ? error.message : "Failed to install Claude hooks.",
      manualSteps,
    };
  }
};

export const uninstallClaudeHooks = async (homeDirectory?: string): Promise<HookInstallResult> => {
  try {
    await execFileAsync("claude", ["plugin", "uninstall", "--scope", "user", claudePluginId]);
    await execFileAsync("claude", ["plugin", "marketplace", "remove", claudeMarketplaceName]);
  } catch {
    // Removing the manifest record is still safe even if Claude already removed the plugin.
  }

  await updateHookInstallRecord("Claude", null, homeDirectory);
  return { success: true, platform: "Claude", installed: false, mode: "automatic" };
};
