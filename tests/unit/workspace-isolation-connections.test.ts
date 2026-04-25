import assert from "node:assert/strict";
import test from "node:test";
import { getWorkspaceIsolationConnectionProofStatusLabel } from "../../src/lib/workspace-isolation-connection-proof-labels.js";
import { resolveWorkspaceIsolationConnections } from "../../src/lib/workspace-isolation-connection-proof.js";
import { getWorkspaceIsolationConnectionTargets } from "../../src/lib/workspace-isolation-connection-targets.js";

test("getWorkspaceIsolationConnectionTargets returns local services and other-project targets only", () => {
  const currentServices = [
    {
      id: "api",
      name: "api",
      slug: "api",
      relativePath: "apps/api",
      port: 4310,
      createdAt: 1,
      connections: [],
    },
    {
      id: "worker",
      name: "worker",
      slug: "worker",
      relativePath: "apps/worker",
      port: 4311,
      createdAt: 1,
      connections: [],
    },
  ];
  const workspaceIsolationProjectTopologies = [
    {
      id: "project-ui",
      kind: "workspace-isolation" as const,
      name: "ui",
      slug: "ui",
      projectId: "project-ui",
      workspaceRootPath: "/ui",
      workspaceRootLabel: "Repository Root",
      projectName: "ui",
      workspaceMode: "monorepo" as const,
      createdAt: 1,
      services: [
        {
          id: "web",
          name: "web",
          slug: "web",
          relativePath: "apps/web",
          port: 0,
          createdAt: 1,
          connections: [],
        },
      ],
    },
    {
      id: "project-backend",
      kind: "workspace-isolation" as const,
      name: "backend",
      slug: "backend",
      projectId: "project-backend",
      workspaceRootPath: "/backend",
      workspaceRootLabel: "Repository Root",
      projectName: "backend",
      workspaceMode: "monorepo" as const,
      createdAt: 1,
      services: [
        {
          id: "other-api",
          name: "other-api",
          slug: "other-api",
          relativePath: "apps/api",
          port: 0,
          createdAt: 1,
          connections: [],
        },
      ],
    },
  ];

  const workspaceIsolationStacks = [
    {
      id: "ui-stack",
      kind: "workspace-isolation" as const,
      name: "ui",
      slug: "ui",
      projectId: "project-ui",
      workspaceRootPath: "/ui",
      workspaceRootLabel: "feature/ui",
      projectName: "ui",
      workspaceMode: "monorepo" as const,
      createdAt: 1,
      services: [
        {
          id: "web",
          name: "web",
          slug: "web",
          relativePath: "apps/web",
          port: 4312,
          createdAt: 1,
          connections: [],
        },
      ],
    },
    {
      id: "same-project-stack",
      kind: "workspace-isolation" as const,
      name: "same-project",
      slug: "same-project",
      projectId: "project-backend",
      workspaceRootPath: "/backend/other",
      workspaceRootLabel: "feature/other",
      projectName: "backend",
      workspaceMode: "monorepo" as const,
      createdAt: 1,
      services: [
        {
          id: "other-api",
          name: "other-api",
          slug: "other-api",
          relativePath: "apps/api",
          port: 4313,
          createdAt: 1,
          connections: [],
        },
      ],
    },
  ];

  const targets = getWorkspaceIsolationConnectionTargets({
    currentProjectId: "project-backend",
    currentProjectName: "backend",
    currentServiceId: "api",
    currentServices,
    currentStackId: "backend-stack",
    currentWorkspaceLabel: "feature/backend",
    currentWorkspaceRootPath: "/backend",
    workspaceIsolationProjectTopologies,
    workspaceIsolationStacks,
  });

  assert.deepEqual(targets.localTargets.map((target) => target.serviceName), ["worker"]);
  assert.deepEqual(targets.externalTargets.map((target) => target.serviceName), ["web"]);
  assert.equal(targets.externalTargets[0]?.enabled, true);
});

test("resolveWorkspaceIsolationConnections distinguishes live, configured, and missing targets", () => {
  const workspaceIsolationProjectTopologies = [
    {
      id: "payments-topology",
      kind: "workspace-isolation" as const,
      name: "payments",
      slug: "payments",
      projectId: "project-payments",
      workspaceRootPath: "/payments",
      workspaceRootLabel: "Repository Root",
      projectName: "payments",
      workspaceMode: "monorepo" as const,
      createdAt: 1,
      services: [
        {
          id: "billing",
          name: "billing",
          slug: "billing",
          relativePath: "apps/billing",
          port: 0,
          createdAt: 1,
          connections: [],
        },
      ],
    },
  ];
  const workspaceIsolationStacks = [
    {
      id: "ui-stack",
      kind: "workspace-isolation" as const,
      name: "ui",
      slug: "ui",
      projectId: "project-ui",
      workspaceRootPath: "/ui",
      workspaceRootLabel: "feature/ui",
      projectName: "ui",
      workspaceMode: "monorepo" as const,
      createdAt: 1,
      services: [
        {
          id: "web",
          name: "web",
          slug: "web",
          relativePath: "apps/web",
          port: 4312,
          createdAt: 1,
          connections: [],
        },
      ],
    },
  ];

  const service = {
    id: "api",
    name: "api",
    slug: "api",
    relativePath: "apps/api",
    port: 4310,
    createdAt: 1,
    connections: [
      {
        id: "link-1",
        envKey: "UI_URL",
        targetStackId: "ui-stack",
        targetServiceId: "web",
      },
      {
        id: "link-2",
        envKey: "BILLING_URL",
        targetStackId: "payments-topology",
        targetServiceId: "billing",
      },
      {
        id: "link-3",
        envKey: "MISSING_URL",
        targetStackId: "missing-stack",
        targetServiceId: "missing-service",
      },
    ],
  };

  const [live, configured, missing] = resolveWorkspaceIsolationConnections({
    service,
    workspaceIsolationProjectTopologies,
    workspaceIsolationStacks,
  });

  assert.equal(live?.targetName, "web");
  assert.equal(live?.targetUrl, "http://web.feature-ui.ui.localhost:1355");
  assert.equal(live?.status, "live_target");
  assert.equal(configured?.targetName, "billing");
  assert.equal(configured?.targetProjectName, "payments");
  assert.equal(configured?.targetUrl, null);
  assert.equal(configured?.status, "configured_target");
  assert.equal(missing?.targetName, "Missing target");
  assert.equal(missing?.targetUrl, null);
  assert.equal(missing?.status, "missing_target");
});

test("getWorkspaceIsolationConnectionProofStatusLabel maps proof states to copy", () => {
  assert.equal(
    getWorkspaceIsolationConnectionProofStatusLabel("live_target"),
    "Live target",
  );
  assert.equal(
    getWorkspaceIsolationConnectionProofStatusLabel("configured_target"),
    "Configured target",
  );
  assert.equal(
    getWorkspaceIsolationConnectionProofStatusLabel("missing_target"),
    "Missing target",
  );
});
