import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createClaudeHooksService } from "../claude-hooks/service.js";
import { CLAUDE_PLUGIN_ID, getClaudeHookPaths } from "../claude-hooks/paths.js";

test("Claude hook install writes assets and calls Claude CLI only when needed", async () => {
  const homeDir = await mkdtemp(path.join(os.tmpdir(), "galactic-claude-install-"));
  const calls: string[][] = [];
  const service = createClaudeHooksService({
    homeDir,
    readRunnerSource: async () => "console.log('runner');\n",
    runClaudeCommand: async (args) => {
      calls.push(args);
    },
  });

  const result = await service.install();
  const paths = getClaudeHookPaths(homeDir);
  const manifest = await readFile(paths.marketplaceManifestPath, "utf8");
  const runner = await readFile(paths.runnerPath, "utf8");

  assert.deepEqual(result, { success: true });
  assert.match(manifest, /galactic-ide-hooks/);
  assert.match(runner, /#!\/usr\/bin\/env node/);
  assert.deepEqual(calls, [
    ["plugin", "marketplace", "add", paths.marketplaceRoot],
    ["plugin", "install", "--scope", "user", CLAUDE_PLUGIN_ID],
  ]);
});

test("Claude hook status reads installed plugin state safely", async () => {
  const homeDir = await mkdtemp(path.join(os.tmpdir(), "galactic-claude-status-"));
  const paths = getClaudeHookPaths(homeDir);
  const service = createClaudeHooksService({ homeDir, runClaudeCommand: async () => undefined });

  await mkdir(path.dirname(paths.claudePluginStatePath), { recursive: true });
  await writeFile(paths.claudePluginStatePath, "{bad json", "utf8");
  assert.equal(await service.isInstalled(), false);

  await writeFile(
    paths.claudePluginStatePath,
    JSON.stringify({ plugins: { [CLAUDE_PLUGIN_ID]: [{ scope: "user" }] } }),
    "utf8",
  );
  assert.equal(await service.isInstalled(), true);
});
