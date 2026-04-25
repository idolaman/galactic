import assert from "node:assert/strict";
import test from "node:test";
import { getWorkspaceIsolationWorkspaceStatus } from "../../src/lib/workspace-isolation-status.js";

const topology = {
  id: "topology-1",
  kind: "workspace-isolation" as const,
  name: "shop",
  slug: "shop",
  projectId: "project-shop",
  workspaceRootPath: "/repo",
  workspaceRootLabel: "Repository Root",
  projectName: "shop",
  workspaceMode: "monorepo" as const,
  createdAt: 1,
  services: [],
};

const stack = {
  id: "stack-1",
  kind: "workspace-isolation" as const,
  name: "shop",
  slug: "shop",
  projectId: "project-shop",
  workspaceRootPath: "/repo",
  workspaceRootLabel: "feature/auth",
  projectName: "shop",
  workspaceMode: "monorepo" as const,
  createdAt: 1,
  services: [],
};

const supportedEnabledShellHooks = {
  enabled: true,
  supported: true,
  installed: true,
  hookPath: "/tmp/hook.zsh",
  zshrcPath: "/tmp/.zshrc",
};

test("getWorkspaceIsolationWorkspaceStatus returns null without a topology", () => {
  assert.equal(
    getWorkspaceIsolationWorkspaceStatus({
      connectionProofs: [],
      proxyStatus: null,
      shellHookStatus: supportedEnabledShellHooks,
      stack: null,
      topology: null,
    }),
    null,
  );
});

test("getWorkspaceIsolationWorkspaceStatus returns ready to activate when only the topology exists", () => {
  assert.deepEqual(
    getWorkspaceIsolationWorkspaceStatus({
      connectionProofs: [],
      proxyStatus: { running: true, port: 1355 },
      shellHookStatus: supportedEnabledShellHooks,
      stack: null,
      topology,
    }),
    {
      state: "ready_to_activate",
      reason: null,
      hasDependencies: false,
      hasNonLiveDependencies: false,
    },
  );
});

test("getWorkspaceIsolationWorkspaceStatus returns active when the workspace is live", () => {
  assert.deepEqual(
    getWorkspaceIsolationWorkspaceStatus({
      connectionProofs: [],
      proxyStatus: { running: true, port: 1355 },
      shellHookStatus: supportedEnabledShellHooks,
      stack,
      topology,
    }),
    {
      state: "active",
      reason: null,
      hasDependencies: false,
      hasNonLiveDependencies: false,
    },
  );
});

test("getWorkspaceIsolationWorkspaceStatus marks Auto-Env off as needs attention", () => {
  assert.deepEqual(
    getWorkspaceIsolationWorkspaceStatus({
      connectionProofs: [],
      proxyStatus: { running: true, port: 1355 },
      shellHookStatus: { ...supportedEnabledShellHooks, enabled: false },
      stack,
      topology,
    }),
    {
      state: "needs_attention",
      reason: "auto_env_off",
      hasDependencies: false,
      hasNonLiveDependencies: false,
    },
  );
});

test("getWorkspaceIsolationWorkspaceStatus marks non-live dependencies as needs attention", () => {
  assert.deepEqual(
    getWorkspaceIsolationWorkspaceStatus({
      connectionProofs: [
        {
          id: "link-1",
          envKey: "BILLING_URL",
          targetStackId: "topology-b",
          targetServiceId: "billing",
          status: "configured_target",
          targetName: "billing",
          targetProjectName: "payments",
          targetWorkspaceLabel: "Repository Root",
          targetUrl: null,
        },
      ],
      proxyStatus: { running: true, port: 1355 },
      shellHookStatus: supportedEnabledShellHooks,
      stack,
      topology,
    }),
    {
      state: "needs_attention",
      reason: "connected_target_not_live",
      hasDependencies: true,
      hasNonLiveDependencies: true,
    },
  );
});

test("getWorkspaceIsolationWorkspaceStatus blocks the workspace when the proxy is unavailable", () => {
  assert.deepEqual(
    getWorkspaceIsolationWorkspaceStatus({
      connectionProofs: [],
      proxyStatus: { running: false, port: 1355 },
      shellHookStatus: supportedEnabledShellHooks,
      stack,
      topology,
    }),
    {
      state: "blocked",
      reason: "proxy_unavailable",
      hasDependencies: false,
      hasNonLiveDependencies: false,
    },
  );
});
