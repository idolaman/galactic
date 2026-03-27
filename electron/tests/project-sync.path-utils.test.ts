import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import {
  isPathWithinTarget,
  isWithinRoot,
  normalizeSyncTargets,
  normalizeRelativePath,
  normalizeSyncTargetPath,
  sanitizeSyncTarget,
} from "../project-sync/path-utils.js";

test("normalizeSyncTargetPath converts slashes and trims leading separators", () => {
  assert.equal(normalizeSyncTargetPath("\\config\\\\env\\.env"), "config/env/.env");
  assert.equal(normalizeSyncTargetPath("  /nested/path/file.txt/  "), "nested/path/file.txt");
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

test("normalizeSyncTargets collapses nested selections under a parent directory", () => {
  assert.deepEqual(
    normalizeSyncTargets([
      { path: "config/app.json", kind: "file" },
      { path: "config", kind: "directory" },
      { path: "config/nested", kind: "directory" },
    ]),
    [{ path: "config", kind: "directory" }],
  );
});

test("normalizeSyncTargets keeps unrelated targets after parent normalization", () => {
  assert.deepEqual(
    normalizeSyncTargets([
      { path: "config/app.json", kind: "file" },
      { path: ".env", kind: "file" },
      { path: "config", kind: "directory" },
    ]),
    [
      { path: "config", kind: "directory" },
      { path: ".env", kind: "file" },
    ],
  );
});

test("isPathWithinTarget recognizes descendants and exact matches", () => {
  assert.equal(isPathWithinTarget("config", "config"), true);
  assert.equal(isPathWithinTarget("config", "config/app.json"), true);
  assert.equal(isPathWithinTarget("config", "configs/app.json"), false);
});
