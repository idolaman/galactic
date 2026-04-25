import assert from "node:assert/strict";
import test from "node:test";
import {
  getNextAvailableServicePort,
  normalizeWorkspaceRootPath,
  normalizeRelativeServicePath,
  sanitizeRelativeServicePathInput,
  toWorkspaceIsolationSlug,
} from "../../src/lib/workspace-isolation-helpers.js";

test("toWorkspaceIsolationSlug normalizes names into stable slugs", () => {
  assert.equal(
    toWorkspaceIsolationSlug("Checkout API Stack"),
    "checkout-api-stack",
  );
  assert.equal(toWorkspaceIsolationSlug("   ", "service"), "service");
});

test("sanitizeRelativeServicePathInput preserves valid folder characters", () => {
  assert.equal(sanitizeRelativeServicePathInput("App//API-1"), "App/API-1");
  assert.equal(sanitizeRelativeServicePathInput("/services/worker/"), "/services/worker/");
  assert.equal(sanitizeRelativeServicePathInput("api_123"), "api_123");
  assert.equal(sanitizeRelativeServicePathInput("packages/ui.kit"), "packages/ui.kit");
  assert.equal(sanitizeRelativeServicePathInput("apps/web-2"), "apps/web-2");
  assert.equal(sanitizeRelativeServicePathInput("app/"), "app/");
  assert.equal(sanitizeRelativeServicePathInput("/"), "/");
});

test("normalizeWorkspaceRootPath preserves filesystem roots", () => {
  assert.equal(normalizeWorkspaceRootPath("/"), "/");
  assert.equal(normalizeWorkspaceRootPath("C:\\"), "C:\\");
  assert.equal(normalizeWorkspaceRootPath("/repo/"), "/repo");
  assert.equal(normalizeWorkspaceRootPath("C:\\repo\\"), "C:\\repo");
});

test("normalizeRelativeServicePath trims leading current-directory prefixes", () => {
  assert.equal(normalizeRelativeServicePath("./apps/api/"), "apps/api");
  assert.equal(normalizeRelativeServicePath("services\\worker\\"), "services/worker");
  assert.equal(normalizeRelativeServicePath("/"), ".");
  assert.equal(normalizeRelativeServicePath(""), ".");
});

test("getNextAvailableServicePort skips used and reserved ports", () => {
  const stacks = [
    {
      id: "stack-1",
      kind: "workspace-isolation" as const,
      name: "Checkout",
      slug: "checkout",
      projectId: "project-1",
      workspaceRootPath: "/repo",
      workspaceRootLabel: "Repository Root",
      projectName: "shop",
      workspaceMode: "monorepo" as const,
      createdAt: 1,
      services: [
        {
          id: "service-1",
          name: "web",
          slug: "web",
          relativePath: "apps/web",
          port: 4310,
          createdAt: 1,
          connections: [],
        },
      ],
    },
  ];

  assert.equal(getNextAvailableServicePort(stacks, [4311]), 4312);
});
