import assert from "node:assert/strict";
import test from "node:test";
import {
  buildProjectConfigImportAction,
  buildProjectConfigManifest,
  parseProjectConfigManifest,
} from "../../src/lib/project-config.js";
import type { WorkspaceIsolationProjectTopology } from "../../src/types/workspace-isolation.js";

const createTopology = (): WorkspaceIsolationProjectTopology => ({
  id: "project-source",
  kind: "workspace-isolation",
  name: "shop",
  slug: "shop",
  projectId: "source-project",
  workspaceRootPath: "/Users/me/shop",
  workspaceRootLabel: "Repository Root",
  projectName: "shop",
  workspaceMode: "monorepo",
  createdAt: 1,
  services: [
    {
      id: "api",
      name: "API",
      slug: "api",
      relativePath: "apps/api",
      port: 4310,
      createdAt: 1,
      connections: [
        {
          id: "api-to-web",
          envKey: "WEB_URL",
          targetStackId: "project-source",
          targetServiceId: "web",
        },
        {
          id: "api-to-external",
          envKey: "BILLING_URL",
          targetStackId: "project-billing",
          targetServiceId: "billing",
        },
      ],
    },
  ],
});

test("buildProjectConfigImportAction rekeys self-referencing Project Services connections", () => {
  const action = buildProjectConfigImportAction(
    buildProjectConfigManifest({
      syncTargets: [],
      projectServices: createTopology(),
    }),
    {
      id: "/Users/me/current",
      name: "current",
      path: "/Users/me/current",
    },
  );

  assert.equal(action.projectServices.type, "save");
  if (action.projectServices.type !== "save") {
    return;
  }
  assert.equal(action.projectServices.input.projectId, "/Users/me/current");
  assert.equal(action.projectServices.input.projectName, "current");
  assert.equal(action.projectServices.input.workspaceRootPath, "/Users/me/current");
  assert.notEqual(
    action.projectServices.input.services[0].connections[0].targetStackId,
    "project-source",
  );
  assert.equal(
    action.projectServices.input.services[0].connections[1].targetStackId,
    "project-billing",
  );
});

test("projectServices null produces a remove-topology import action", () => {
  const action = buildProjectConfigImportAction(
    parseProjectConfigManifest({
      kind: "galactic-project-config",
      version: 1,
      workspaceConfigSync: { syncTargets: [] },
      projectServices: null,
    }),
    { id: "project-1", name: "shop", path: "/repo" },
  );

  assert.deepEqual(action.projectServices, { type: "remove" });
});
