import assert from "node:assert/strict";
import test from "node:test";
import {
  WORKSPACE_ISOLATION_AUTO_ENV_RELOAD_INSTRUCTION,
  getWorkspaceIsolationActivationReloadDescription,
  getWorkspaceIsolationActivationReloadTitle,
  getWorkspaceIsolationAutoEnvBadgeLabel,
  getWorkspaceIsolationAutoEnvSuccessDescription,
  getWorkspaceIsolationAutoEnvSummary,
} from "../../src/lib/workspace-isolation-support.js";

test("getWorkspaceIsolationAutoEnvBadgeLabel matches the current support state", () => {
  assert.equal(getWorkspaceIsolationAutoEnvBadgeLabel(null), "Unsupported");
  assert.equal(
    getWorkspaceIsolationAutoEnvBadgeLabel({
      enabled: false,
      supported: true,
      installed: false,
      hookPath: null,
      zshrcPath: null,
    }),
    "Needs setup",
  );
  assert.equal(
    getWorkspaceIsolationAutoEnvBadgeLabel({
      enabled: true,
      supported: true,
      installed: true,
      hookPath: "/tmp/hook.zsh",
      zshrcPath: "/tmp/.zshrc",
    }),
    "Enabled",
  );
});

test("getWorkspaceIsolationAutoEnvSummary includes the reload instruction when enabled", () => {
  const summary = getWorkspaceIsolationAutoEnvSummary({
    enabled: true,
    supported: true,
    installed: true,
    hookPath: "/tmp/hook.zsh",
    zshrcPath: "/tmp/.zshrc",
    message: "Managed zsh hook installed.",
  });

  assert.match(summary, /Managed zsh hook installed/);
  assert.match(summary, new RegExp(WORKSPACE_ISOLATION_AUTO_ENV_RELOAD_INSTRUCTION));
});

test("getWorkspaceIsolationAutoEnvSuccessDescription keeps the reload next step explicit", () => {
  const description = getWorkspaceIsolationAutoEnvSuccessDescription();

  assert.match(description, /New terminals will pick it up automatically/);
  assert.match(description, new RegExp(WORKSPACE_ISOLATION_AUTO_ENV_RELOAD_INSTRUCTION));
});

test("activation reload copy stays workspace-specific", () => {
  const workspaceLabel = "shop/api";

  assert.equal(
    getWorkspaceIsolationActivationReloadTitle(workspaceLabel),
    "Reload zsh to use Project Services in shop/api",
  );
  assert.match(
    getWorkspaceIsolationActivationReloadDescription(workspaceLabel),
    /Project Services is active for shop\/api/,
  );
});
