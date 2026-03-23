import assert from "node:assert/strict";
import test from "node:test";
import { getMcpInstallationDetails } from "../../src/lib/mcp-installation-details.js";

test("getMcpInstallationDetails returns Claude CLI commands", () => {
  const details = getMcpInstallationDetails("Claude");

  assert.equal(details.description, "Galactic uses Claude Code CLI commands to add and verify the MCP server.");
  assert.deepEqual(details.sections, [
    {
      label: "Install Command",
      value: "claude mcp add --transport http --scope user galactic http://localhost:17890",
    },
  ]);
});

test("getMcpInstallationDetails keeps Codex on TOML config injection", () => {
  const details = getMcpInstallationDetails("Codex");

  assert.equal(details.sections[0]?.value, "~/.codex/config.toml");
  assert.match(details.sections[1]?.value ?? "", /\[mcp_servers\.galactic\]/);
});
