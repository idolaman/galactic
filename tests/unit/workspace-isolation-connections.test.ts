import assert from "node:assert/strict";
import test from "node:test";
import { getWorkspaceIsolationConnectionTargets } from "../../src/lib/workspace-isolation-connection-targets.js";
import { resolveWorkspaceIsolationConnections } from "../../src/lib/workspace-isolation-connection-resolution.js";

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
    workspaceIsolationStacks,
  });

  assert.deepEqual(targets.localTargets.map((target) => target.serviceName), ["worker"]);
  assert.deepEqual(targets.externalTargets.map((target) => target.serviceName), ["web"]);
});

test("resolveWorkspaceIsolationConnections keeps missing targets visible", () => {
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
        envKey: "MISSING_URL",
        targetStackId: "missing-stack",
        targetServiceId: "missing-service",
      },
    ],
  };

  const [resolved, missing] = resolveWorkspaceIsolationConnections(
    workspaceIsolationStacks,
    service,
  );

  assert.equal(resolved?.targetName, "web");
  assert.equal(resolved?.targetUrl, "http://web.feature-ui.ui.localhost:1355");
  assert.equal(resolved?.isMissing, false);
  assert.equal(missing?.targetName, "Missing target");
  assert.equal(missing?.targetUrl, null);
  assert.equal(missing?.isMissing, true);
});
