import assert from "node:assert/strict";
import test from "node:test";
import {
  getWorkspaceIsolationAnalyticsAutoEnvState,
  getWorkspaceIsolationAnalyticsOpeningStep,
  getWorkspaceIsolationAnalyticsSummary,
} from "../../src/lib/workspace-isolation-analytics.js";

test("workspace isolation analytics auto-env state stays privacy-safe and coarse", () => {
  assert.equal(getWorkspaceIsolationAnalyticsAutoEnvState(null), "unsupported");
  assert.equal(
    getWorkspaceIsolationAnalyticsAutoEnvState({
      enabled: false,
      supported: false,
      installed: false,
      hookPath: null,
      zshrcPath: null,
    }),
    "unsupported",
  );
  assert.equal(
    getWorkspaceIsolationAnalyticsAutoEnvState({
      enabled: false,
      supported: true,
      installed: false,
      hookPath: "/hook.zsh",
      zshrcPath: "/.zshrc",
    }),
    "needs-setup",
  );
  assert.equal(
    getWorkspaceIsolationAnalyticsAutoEnvState({
      enabled: true,
      supported: true,
      installed: true,
      hookPath: "/hook.zsh",
      zshrcPath: "/.zshrc",
    }),
    "enabled",
  );
});

test("workspace isolation analytics opening step collapses setup flow to three buckets", () => {
  assert.equal(getWorkspaceIsolationAnalyticsOpeningStep(1), "intro");
  assert.equal(getWorkspaceIsolationAnalyticsOpeningStep(2), "auto-env");
  assert.equal(getWorkspaceIsolationAnalyticsOpeningStep(3), "configuration");
  assert.equal(getWorkspaceIsolationAnalyticsOpeningStep(4), "configuration");
});

test("workspace isolation analytics summary counts services and complete connections only", () => {
  assert.deepEqual(
    getWorkspaceIsolationAnalyticsSummary("stack-1", "monorepo", [
      {
        id: "web",
        name: "web",
        slug: "web",
        relativePath: "apps/web",
        port: 4310,
        createdAt: 1,
        connections: [
          {
            id: "local",
            envKey: "API_URL",
            targetStackId: "stack-1",
            targetServiceId: "api",
          },
          {
            id: "external",
            envKey: "AUTH_URL",
            targetStackId: "stack-2",
            targetServiceId: "auth",
          },
          {
            id: "incomplete",
            envKey: "",
            targetStackId: "stack-2",
            targetServiceId: "broken",
          },
        ],
      },
      {
        id: "api",
        name: "api",
        slug: "api",
        relativePath: "apps/api",
        port: 4311,
        createdAt: 2,
        connections: [],
      },
    ]),
    {
      workspaceMode: "monorepo",
      serviceCount: 2,
      connectionCount: 2,
      externalConnectionCount: 1,
    },
  );
});
