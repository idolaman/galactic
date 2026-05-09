import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  AUTH_STORAGE_KEYS,
  GLOBAL_LOCAL_STORAGE_KEYS,
  USER_SCOPED_LOCAL_STORAGE_DATASETS,
} from "../../src/services/local-storage-keys.js";

const SRC_ROOT = path.join(process.cwd(), "src");
const ALLOWED_LOCAL_STORAGE_FILES = new Set([
  path.join("src", "services", "local-storage-scope.ts"),
]);
const LOCAL_STORAGE_REFERENCE_PATTERN = /\b(?:window\.)?localStorage(?:\.|\s*\?\?)/;

const collectSourceFiles = (directory: string): string[] => {
  const entries = readdirSync(directory);
  return entries.flatMap((entry) => {
    const fullPath = path.join(directory, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      return collectSourceFiles(fullPath);
    }
    return /\.(ts|tsx)$/.test(entry) ? [fullPath] : [];
  });
};

test("local storage ownership policy classifies current persisted keys", () => {
  assert.deepEqual([...USER_SCOPED_LOCAL_STORAGE_DATASETS], [
    "projects",
    "environments",
  ]);
  assert.deepEqual(GLOBAL_LOCAL_STORAGE_KEYS, {
    preferredEditor: "preferredEditor",
    theme: "galactic-ide-theme",
    updateToastDismissed: "galactic-ide:update-toast-dismissed",
  });
  assert.deepEqual(AUTH_STORAGE_KEYS, {
    pendingState: "galactic-ide:auth:pending-state",
  });
});

test("renderer code accesses localStorage only through the storage scope service", () => {
  const offenders = collectSourceFiles(SRC_ROOT).flatMap((filePath) => {
    const relativePath = path.relative(process.cwd(), filePath);
    if (ALLOWED_LOCAL_STORAGE_FILES.has(relativePath)) {
      return [];
    }

    const source = readFileSync(filePath, "utf-8");
    return LOCAL_STORAGE_REFERENCE_PATTERN.test(source) ? [relativePath] : [];
  });

  assert.deepEqual(offenders, []);
});
