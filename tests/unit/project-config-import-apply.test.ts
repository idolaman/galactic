import assert from "node:assert/strict";
import test from "node:test";
import { applyProjectConfigImport } from "../../src/lib/project-config-import-apply.js";
import { buildProjectConfigImportReview } from "../../src/lib/project-config-import-review.js";
import type { ProjectConfigImportAction } from "../../src/lib/project-config.js";

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
      services: [{
        id: "web",
        name: "web",
        slug: "web",
        relativePath: "apps/web",
        port: 4310,
        createdAt: 1,
        connections: [],
      }],
    },
  },
};

const project = {
  id: "project-1",
  name: "shop",
  path: "/repo",
  isGitRepo: true,
  syncTargets: [],
};

const createReview = () =>
  buildProjectConfigImportReview({
    action: saveAction,
    currentSyncTargets: [],
    currentTopology: null,
  });

test("applyProjectConfigImport mutates only from the confirmation path", async () => {
  let updatedSyncTargets = 0;
  let savedTopology = false;

  await applyProjectConfigImport({
    project,
    review: createReview(),
    currentTopology: null,
    saveProjectTopology: async () => {
      savedTopology = true;
      return { success: true };
    },
    deleteProjectTopology: async () => ({ success: true }),
    updateProject: (nextProject) => {
      updatedSyncTargets = nextProject.syncTargets?.length ?? 0;
    },
  });

  assert.equal(savedTopology, true);
  assert.equal(updatedSyncTargets, 1);
});

test("applyProjectConfigImport does not update sync targets when Project Services save fails", async () => {
  let didUpdateProject = false;

  await assert.rejects(
    applyProjectConfigImport({
      project,
      review: createReview(),
      currentTopology: null,
      saveProjectTopology: async () => ({ success: false, error: "save failed" }),
      deleteProjectTopology: async () => ({ success: true }),
      updateProject: () => {
        didUpdateProject = true;
      },
    }),
    /save failed/,
  );

  assert.equal(didUpdateProject, false);
});
