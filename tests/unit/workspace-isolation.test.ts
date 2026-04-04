import assert from "node:assert/strict";
import test from "node:test";
import {
  getWorkspaceIsolationHostnames,
  getWorkspaceIsolationName,
  getWorkspaceIsolationRouteSummary,
  getWorkspaceIsolationServicePathLabel,
} from "../../src/lib/workspace-isolation.js";

test("getWorkspaceIsolationName uses the project name for repository root", () => {
  assert.equal(getWorkspaceIsolationName("shop", "Repository Root"), "shop");
});

test("getWorkspaceIsolationName uses the workspace label for worktrees", () => {
  assert.equal(getWorkspaceIsolationName("shop", "feature/auth"), "feature/auth");
});

test("getWorkspaceIsolationHostnames returns the first preview hostnames", () => {
  const stack = {
    id: "stack-1",
    kind: "service-stack" as const,
    name: "shop",
    slug: "shop",
    projectId: "project-shop",
    workspaceRootPath: "/repo",
    workspaceRootLabel: "Repository Root",
    projectName: "shop",
    workspaceMode: "monorepo" as const,
    createdAt: 1,
    services: [
      {
        id: "web",
        name: "web",
        slug: "web",
        relativePath: "apps/web",
        port: 4310,
        createdAt: 1,
        connections: [],
      },
      {
        id: "api",
        name: "api",
        slug: "api",
        relativePath: "apps/api",
        port: 4311,
        createdAt: 1,
        connections: [],
      },
      {
        id: "worker",
        name: "worker",
        slug: "worker",
        relativePath: "apps/worker",
        port: 4312,
        createdAt: 1,
        connections: [],
      },
    ],
  };

  assert.deepEqual(getWorkspaceIsolationHostnames(stack), [
    "web.root.shop.localhost",
    "api.root.shop.localhost",
  ]);
});

test("getWorkspaceIsolationRouteSummary maps the public domain to the internal target", () => {
  assert.equal(
    getWorkspaceIsolationRouteSummary(
      { projectName: "shop", workspaceRootLabel: "feature/auth" },
      { slug: "api", port: 4310 },
    ),
    "api.feature-auth.shop.localhost -> localhost:4310",
  );
});

test("getWorkspaceIsolationServicePathLabel keeps workspace root context", () => {
  assert.equal(
    getWorkspaceIsolationServicePathLabel({ relativePath: "." }),
    "Workspace root",
  );
});

test("getWorkspaceIsolationServicePathLabel keeps duplicate simple paths visible", () => {
  assert.equal(
    getWorkspaceIsolationServicePathLabel({ relativePath: "api" }),
    "api",
  );
});

test("getWorkspaceIsolationServicePathLabel keeps nested paths", () => {
  assert.equal(
    getWorkspaceIsolationServicePathLabel({
      relativePath: "apps/api",
    }),
    "apps/api",
  );
});
