import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createAgentIntegrationsService } from "../agent-integrations.js";

test("Claude MCP install writes ~/.claude.json and reports installed", async () => {
  const homeDir = await import("node:fs/promises").then(({ mkdtemp }) =>
    mkdtemp(path.join(os.tmpdir(), "galactic-claude-mcp-")),
  );
  const service = createAgentIntegrationsService({
    homeDir,
    claudeHooksService: {
      getStatus: async () => "not-installed",
      install: async () => ({ success: true }),
      isInstalled: async () => false,
    },
  });

  assert.equal(await service.checkMcpInstalled("Claude"), false);
  assert.deepEqual(await service.installMcp("Claude"), { success: true });
  assert.equal(await service.checkMcpInstalled("Claude"), true);

  const config = await readFile(path.join(homeDir, ".claude.json"), "utf8");
  assert.match(config, /"galactic"/);
  assert.match(config, /"http:\/\/localhost:17890"/);
});

test("Claude hooks install and MCP status remain independent", async () => {
  const homeDir = await import("node:fs/promises").then(({ mkdtemp }) =>
    mkdtemp(path.join(os.tmpdir(), "galactic-claude-dual-")),
  );
  let hooksInstalled = false;
  const service = createAgentIntegrationsService({
    homeDir,
    claudeHooksService: {
      getStatus: async () => hooksInstalled ? "installed" : "not-installed",
      install: async () => {
        hooksInstalled = true;
        return { success: true };
      },
      isInstalled: async () => hooksInstalled,
    },
  });

  assert.equal(await service.checkClaudeHooksInstalled(), false);
  assert.equal(await service.checkMcpInstalled("Claude"), false);

  await service.installMcp("Claude");
  assert.equal(await service.checkMcpInstalled("Claude"), true);
  assert.equal(await service.checkClaudeHooksInstalled(), false);

  await service.installClaudeHooks();
  assert.equal(await service.checkClaudeHooksInstalled(), true);
  assert.equal(await service.checkMcpInstalled("Claude"), true);
  assert.deepEqual(await service.getHookStatuses(), { claude: "installed" });
});
