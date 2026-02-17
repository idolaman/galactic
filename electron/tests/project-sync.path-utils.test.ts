import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import {
  isWithinRoot,
  normalizeRelativePath,
  normalizeSyncTargetPath,
  sanitizeSyncTarget,
} from "../project-sync/path-utils.js";

test("normalizeSyncTargetPath converts slashes and trims leading separators", () => {
  assert.equal(normalizeSyncTargetPath("\\config\\\\env\\.env"), "config/env/.env");
  assert.equal(normalizeSyncTargetPath("  /nested/path/file.txt  "), "nested/path/file.txt");
});

test("normalizeRelativePath always uses forward slashes", () => {
  const root = path.join("tmp", "project-root");
  const entry = path.join(root, "nested", "file.txt");
  assert.equal(normalizeRelativePath(root, entry), "nested/file.txt");
});

test("sanitizeSyncTarget accepts valid targets and rejects invalid ones", () => {
  assert.deepEqual(
    sanitizeSyncTarget({ path: "/.env.local", kind: "file" }),
    { path: ".env.local", kind: "file" },
  );
  assert.deepEqual(
    sanitizeSyncTarget({ path: " config ", kind: "directory" }),
    { path: "config", kind: "directory" },
  );
  assert.equal(sanitizeSyncTarget({ path: "", kind: "file" }), null);
  assert.equal(sanitizeSyncTarget({ path: ".env", kind: "invalid" as never }), null);
});

test("isWithinRoot blocks path traversal outside root", () => {
  const root = path.resolve("/tmp", "galactic-tests-root");
  const safePath = path.join(root, "nested", ".env");
  const unsafePath = path.resolve(root, "..", "outside", ".env");
  assert.equal(isWithinRoot(root, safePath), true);
  assert.equal(isWithinRoot(root, unsafePath), false);
});
