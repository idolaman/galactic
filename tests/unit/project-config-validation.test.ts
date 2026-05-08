import assert from "node:assert/strict";
import test from "node:test";
import { parseProjectConfigManifest } from "../../src/lib/project-config.js";

test("parseProjectConfigManifest rejects non-finite Project Services numbers", () => {
  assert.throws(
    () =>
      parseProjectConfigManifest({
        kind: "galactic-project-config",
        version: 1,
        workspaceConfigSync: { syncTargets: [] },
        projectServices: {
          sourceTopologyId: "project-source",
          workspaceMode: "monorepo",
          services: [
            {
              id: "api",
              name: "API",
              slug: "api",
              relativePath: "apps/api",
              port: Infinity,
              createdAt: 1,
              connections: [],
            },
          ],
        },
      }),
    /malformed/,
  );
});
