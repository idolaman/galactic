import assert from "node:assert/strict";
import test from "node:test";
import { buildProjectConfigImportReview } from "../../src/lib/project-config-import-review.js";
import { buildProjectConfigImportReviewRows } from "../../src/lib/project-config-import-review-rows.js";
import type { ProjectConfigImportAction } from "../../src/lib/project-config.js";

const importedService = {
  id: "web",
  name: "web",
  slug: "web",
  relativePath: "apps/web",
  port: 4310,
  createdAt: 1,
  connections: [
    {
      id: "external-api",
      envKey: "API_URL",
      targetStackId: "project-api",
      targetServiceId: "api",
    },
  ],
};

const saveAction: ProjectConfigImportAction = {
  syncTargets: [{ path: ".env", kind: "file" }],
  projectServices: {
    type: "save",
    input: {
      name: "shop",
      projectId: "project-1",
      workspaceRootPath: "/repo",
      workspaceRootLabel: "Repository Root",
      projectName: "shop",
      workspaceMode: "monorepo",
      services: [importedService],
    },
  },
};

test("buildProjectConfigImportReview summarizes replacement and external references", () => {
  const review = buildProjectConfigImportReview({
    action: saveAction,
    currentSyncTargets: [
      { path: ".env.local", kind: "file" },
      { path: "config", kind: "directory" },
    ],
    currentTopology: {
      id: "project-current",
      kind: "workspace-isolation",
      name: "shop",
      slug: "shop",
      projectId: "project-1",
      workspaceRootPath: "/repo",
      workspaceRootLabel: "Repository Root",
      projectName: "shop",
      workspaceMode: "monorepo",
      createdAt: 1,
      services: [{ ...importedService, connections: [] }],
    },
  });

  assert.equal(review.syncTargetCount, 1);
  assert.equal(review.currentSyncTargetCount, 2);
  assert.equal(review.serviceCount, 1);
  assert.equal(review.currentServiceCount, 1);
  assert.equal(review.externalConnectionCount, 1);
  assert.equal(review.servicesKind, "save");
});

test("buildProjectConfigImportReview marks null Project Services as remove only when a topology exists", () => {
  const removeAction: ProjectConfigImportAction = {
    syncTargets: [],
    projectServices: { type: "remove" },
  };

  assert.equal(
    buildProjectConfigImportReview({
      action: removeAction,
      currentSyncTargets: [],
      currentTopology: null,
    }).servicesKind,
    "none",
  );
});

test("buildProjectConfigImportReviewRows marks replacement warnings", () => {
  const rows = buildProjectConfigImportReviewRows({
    action: saveAction,
    syncTargetCount: 1,
    currentSyncTargetCount: 2,
    serviceCount: 1,
    currentServiceCount: 1,
    externalConnectionCount: 1,
    servicesKind: "save",
  });

  assert.deepEqual(
    rows.map((row) => [row.id, row.action, row.tone]),
    [
      ["sync-targets", "Replace", "default"],
      ["project-services", "Replace", "default"],
      ["external-connections", "Keep", "warning"],
    ],
  );
});

test("buildProjectConfigImportReviewRows marks service removal as destructive", () => {
  const rows = buildProjectConfigImportReviewRows({
    action: { syncTargets: [], projectServices: { type: "remove" } },
    syncTargetCount: 0,
    currentSyncTargetCount: 1,
    serviceCount: 0,
    currentServiceCount: 2,
    externalConnectionCount: 0,
    servicesKind: "remove",
  });

  assert.equal(rows[1]?.action, "Remove");
  assert.equal(rows[1]?.tone, "destructive");
  assert.equal(rows.length, 2);
});
