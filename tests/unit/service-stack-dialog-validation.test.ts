import assert from "node:assert/strict";
import test from "node:test";
import { validateServiceStackDraft } from "../../src/lib/service-stack-dialog-validation.js";

test("validateServiceStackDraft accepts an app service in single-app mode", () => {
  const result = validateServiceStackDraft("shop", "stack-1", "single-app", [
    {
      id: "service-1",
      name: "",
      slug: "",
      relativePath: "",
      port: 4310,
      createdAt: 1,
      connections: [],
    },
  ]);

  assert.equal("error" in result, false);
  if ("error" in result) {
    return;
  }

  assert.equal(result.services[0]?.name, "App");
  assert.equal(result.services[0]?.slug, "app");
  assert.equal(result.services[0]?.relativePath, ".");
});

test("validateServiceStackDraft rejects duplicate normalized service paths", () => {
  const result = validateServiceStackDraft("shop", "stack-1", "monorepo", [
    {
      id: "service-1",
      name: "",
      slug: "",
      relativePath: "apps/api",
      port: 4310,
      createdAt: 1,
      connections: [],
    },
    {
      id: "service-2",
      name: "",
      slug: "",
      relativePath: "./apps/api/",
      port: 4311,
      createdAt: 1,
      connections: [],
    },
  ]);

  assert.equal("error" in result, true);
  if ("error" in result) {
    assert.equal(result.error.title, "Duplicate folders");
  }
});

test("validateServiceStackDraft requires explicit folder paths in monorepo mode", () => {
  const result = validateServiceStackDraft("shop", "stack-1", "monorepo", [
    {
      id: "service-1",
      name: "",
      slug: "",
      relativePath: "",
      port: 4310,
      createdAt: 1,
      connections: [],
    },
  ]);

  assert.equal("error" in result, true);
  if ("error" in result) {
    assert.equal(result.error.title, "Folder path required");
  }
});

test("validateServiceStackDraft rejects / in monorepo mode", () => {
  const result = validateServiceStackDraft("shop", "stack-1", "monorepo", [
    {
      id: "service-1",
      name: "",
      slug: "",
      relativePath: "/",
      port: 4310,
      createdAt: 1,
      connections: [],
    },
  ]);

  assert.equal("error" in result, true);
  if ("error" in result) {
    assert.equal(result.error.title, "Folder path required");
  }
});

test("validateServiceStackDraft sanitizes folder paths before saving", () => {
  const result = validateServiceStackDraft("shop", "stack-1", "monorepo", [
    {
      id: "service-1",
      name: "",
      slug: "",
      relativePath: "App//API-1",
      port: 4310,
      createdAt: 1,
      connections: [],
    },
  ]);

  assert.equal("error" in result, false);
  if ("error" in result) {
    return;
  }

  assert.equal(result.services[0]?.name, "api");
  assert.equal(result.services[0]?.relativePath, "app/api");
});
