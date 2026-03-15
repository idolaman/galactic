import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { buildClaudeMarketplaceManifest, buildClaudePluginReadme } from "./manifest.js";
import { CLAUDE_MARKETPLACE_NAME, CLAUDE_PLUGIN_ID, getClaudeHookPaths } from "./paths.js";
import { readClaudeHookSessions } from "./sessions.js";
import type { ClaudeHookSnapshot } from "./types.js";

const execFileAsync = promisify(execFile);

interface InstalledPluginState {
  plugins?: Record<string, unknown[]>;
}

interface MarketplaceState {
  [key: string]: unknown;
}

interface ClaudeHooksServiceOptions {
  homeDir?: string;
  readRunnerSource?: () => Promise<string>;
  runClaudeCommand?: (args: string[]) => Promise<void>;
}

const readJsonFile = async <T>(filePath: string, fallback: T): Promise<T> => {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
};

const defaultReadRunnerSource = async (): Promise<string> => {
  const sourcePath = new URL("./runtime/galactic-claude-hook.js", import.meta.url);
  return fs.readFile(sourcePath, "utf8");
};

const defaultRunClaudeCommand = async (args: string[]): Promise<void> => {
  await execFileAsync("claude", args, { maxBuffer: 1024 * 1024 });
};

export const createClaudeHooksService = ({
  homeDir,
  readRunnerSource = defaultReadRunnerSource,
  runClaudeCommand = defaultRunClaudeCommand,
}: ClaudeHooksServiceOptions = {}) => {
  const paths = getClaudeHookPaths(homeDir);

  const isInstalled = async (): Promise<boolean> => {
    const installedPlugins = await readJsonFile<InstalledPluginState>(paths.claudePluginStatePath, {});
    return Array.isArray(installedPlugins.plugins?.[CLAUDE_PLUGIN_ID]);
  };

  const install = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const runnerSource = await readRunnerSource();
      await fs.mkdir(path.dirname(paths.marketplaceManifestPath), { recursive: true });
      await fs.mkdir(path.dirname(paths.pluginReadmePath), { recursive: true });
      await fs.mkdir(path.dirname(paths.runnerPath), { recursive: true });
      await fs.writeFile(paths.marketplaceManifestPath, buildClaudeMarketplaceManifest(paths.runnerPath), "utf8");
      await fs.writeFile(paths.pluginReadmePath, buildClaudePluginReadme(), "utf8");
      await fs.writeFile(paths.runnerPath, `#!/usr/bin/env node\n${runnerSource}`, "utf8");
      await fs.chmod(paths.runnerPath, 0o755);

      const marketplaces = await readJsonFile<MarketplaceState>(paths.claudeMarketplaceStatePath, {});
      if (!(CLAUDE_MARKETPLACE_NAME in marketplaces)) {
        await runClaudeCommand(["plugin", "marketplace", "add", paths.marketplaceRoot]);
      }
      if (!(await isInstalled())) {
        await runClaudeCommand(["plugin", "install", "--scope", "user", CLAUDE_PLUGIN_ID]);
      }
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to install Claude hooks.";
      return { success: false, error: message };
    }
  };

  const readSessionSnapshot = async (): Promise<ClaudeHookSnapshot> => {
    const installed = existsSync(paths.marketplaceManifestPath) && await isInstalled();
    return { installed, sessions: await readClaudeHookSessions(paths.eventLogPath) };
  };

  return { isInstalled, install, readSessionSnapshot };
};
