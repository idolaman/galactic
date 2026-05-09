import assert from "node:assert/strict";
import test from "node:test";
import {
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

test("buildProjectConfigManifest exports only sync targets and project service topology metadata", () => {
  const manifest = buildProjectConfigManifest({
    syncTargets: [
      { path: " .env ", kind: "file" },
      { path: "config", kind: "directory" },
      { path: "config/local.json", kind: "file" },
    ],
    projectServices: createTopology(),
  });

  assert.deepEqual(manifest.workspaceConfigSync.syncTargets, [
    { path: "config", kind: "directory" },
    { path: ".env", kind: "file" },
  ]);
  assert.equal(manifest.projectServices?.sourceTopologyId, "project-source");
  assert.equal("workspaces" in manifest, false);
  assert.equal("workspaceIsolationStacks" in manifest, false);
  assert.equal("enabledWorkspaces" in manifest, false);
  assert.equal("workspaceRootPath" in manifest.projectServices!, false);
});

test("parseProjectConfigManifest normalizes sync targets and collapses duplicates", () => {
  const parsed = parseProjectConfigManifest({
    kind: "galactic-project-config",
    version: 1,
    workspaceConfigSync: {
      syncTargets: [
        { path: "config/local.json", kind: "file" },
        { path: "config", kind: "directory" },
        { path: "config", kind: "directory" },
        { path: "\\.env\\", kind: "file" },
      ],
    },
    projectServices: null,
  });

  assert.deepEqual(parsed.workspaceConfigSync.syncTargets, [
    { path: "config", kind: "directory" },
    { path: ".env", kind: "file" },
  ]);
});

test("parseProjectConfigManifest rejects invalid kind, version, and malformed services", () => {
  assert.throws(
    () =>
      parseProjectConfigManifest({
        kind: "other",
        version: 1,
        workspaceConfigSync: { syncTargets: [] },
        projectServices: null,
      }),
    /not a Galactic project config/,
  );
  assert.throws(
    () =>
      parseProjectConfigManifest({
        kind: "galactic-project-config",
        version: 2,
        workspaceConfigSync: { syncTargets: [] },
        projectServices: null,
      }),
    /not supported/,
  );
  assert.throws(
    () =>
      parseProjectConfigManifest({
        kind: "galactic-project-config",
        version: 1,
        workspaceConfigSync: { syncTargets: [] },
        projectServices: {
          sourceTopologyId: "project-source",
          workspaceMode: "monorepo",
          services: [{ id: "api" }],
        },
      }),
    /malformed/,
  );
});
