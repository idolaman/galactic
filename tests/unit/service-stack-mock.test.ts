import assert from "node:assert/strict";
import test from "node:test";
import {
  getNextMockServicePort,
  normalizeRelativeServicePath,
  sanitizeRelativeServicePathInput,
  toServiceStackSlug,
} from "../../src/lib/service-stack-mock.js";

test("toServiceStackSlug normalizes names into stable slugs", () => {
  assert.equal(toServiceStackSlug("Checkout API Stack"), "checkout-api-stack");
  assert.equal(toServiceStackSlug("   ", "service"), "service");
});

test("sanitizeRelativeServicePathInput keeps only lowercase letters and slashes", () => {
  assert.equal(sanitizeRelativeServicePathInput("App//API-1"), "app/api");
  assert.equal(sanitizeRelativeServicePathInput("/services/worker/"), "/services/worker/");
  assert.equal(sanitizeRelativeServicePathInput("api_123"), "api");
  assert.equal(sanitizeRelativeServicePathInput("app/"), "app/");
  assert.equal(sanitizeRelativeServicePathInput("/"), "/");
});

test("normalizeRelativeServicePath trims leading current-directory prefixes", () => {
  assert.equal(normalizeRelativeServicePath("./apps/api/"), "apps/api");
  assert.equal(normalizeRelativeServicePath("services\\worker\\"), "services/worker");
  assert.equal(normalizeRelativeServicePath("/"), ".");
  assert.equal(normalizeRelativeServicePath(""), ".");
});

test("getNextMockServicePort skips used and reserved ports", () => {
  const stacks = [
    {
      id: "stack-1",
      kind: "service-stack" as const,
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

  assert.equal(getNextMockServicePort(stacks, [4311]), 4312);
});
