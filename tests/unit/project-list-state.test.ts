import assert from "node:assert/strict";
import test from "node:test";

import { loadProjectsForActiveScope } from "../../src/lib/project-list-state.js";
import {
  PRODUCT_STORAGE_AUTH_REQUIRED_ERROR,
  PRODUCT_STORAGE_UNAVAILABLE_ERROR,
} from "../../src/services/local-storage-scope.js";

test("loadProjectsForActiveScope returns empty projects without an active user", () => {
  let loadCount = 0;

  const projects = loadProjectsForActiveScope({
    getActiveUserId: () => null,
    loadProjects: () => {
      loadCount += 1;
      return ["project-1"];
    },
  });

  assert.deepEqual(projects, []);
  assert.equal(loadCount, 0);
});

test("loadProjectsForActiveScope returns loaded projects for an active user", () => {
  const projects = loadProjectsForActiveScope({
    getActiveUserId: () => "user-1",
    loadProjects: () => ["project-1"],
  });

  assert.deepEqual(projects, ["project-1"]);
});

test("loadProjectsForActiveScope clears projects for known storage scope errors", () => {
  const authRequiredProjects = loadProjectsForActiveScope({
    getActiveUserId: () => "user-1",
    loadProjects: () => {
      throw new Error(PRODUCT_STORAGE_AUTH_REQUIRED_ERROR);
    },
  });
  const unavailableProjects = loadProjectsForActiveScope({
    getActiveUserId: () => "user-1",
    loadProjects: () => {
      throw new Error(PRODUCT_STORAGE_UNAVAILABLE_ERROR);
    },
  });

  assert.deepEqual(authRequiredProjects, []);
  assert.deepEqual(unavailableProjects, []);
});

test("loadProjectsForActiveScope rethrows unexpected storage errors", () => {
  assert.throws(
    () =>
      loadProjectsForActiveScope({
        getActiveUserId: () => "user-1",
        loadProjects: () => {
          throw new Error("Unexpected failure.");
        },
      }),
    /Unexpected failure/,
  );
});
