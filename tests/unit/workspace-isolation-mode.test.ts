import assert from "node:assert/strict";
import test from "node:test";
import {
  createMonorepoDraftServices,
  createSingleAppDraftServices,
  getWorkspaceIsolationMode,
} from "../../src/lib/workspace-isolation-mode.js";

test("getWorkspaceIsolationMode defaults to monorepo", () => {
  assert.equal(getWorkspaceIsolationMode(), "monorepo");
  assert.equal(
    getWorkspaceIsolationMode({ workspaceMode: "single-app" }),
    "single-app",
  );
});

test("createSingleAppDraftServices forces one root service", () => {
  const services = createSingleAppDraftServices([
    {
      id: "api",
      name: "",
      slug: "",
      relativePath: "apps/api",
      port: 4310,
      createdAt: 1,
      connections: [],
    },
    {
      id: "worker",
      name: "",
      slug: "",
      relativePath: "apps/worker",
      port: 4311,
      createdAt: 1,
      connections: [],
    },
  ], []);

  assert.equal(services.length, 1);
  assert.equal(services[0]?.relativePath, ".");
});

test("createMonorepoDraftServices restores existing service lists", () => {
  const services = createMonorepoDraftServices([
    {
      id: "api",
      name: "",
      slug: "",
      relativePath: "apps/api",
      port: 4310,
      createdAt: 1,
      connections: [],
    },
  ], []);

  assert.equal(services.length, 1);
  assert.equal(services[0]?.relativePath, "apps/api");
});
