import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { UserScopedWorkspaceCache } from "../utils/user-scoped-workspace-cache.js";

const createTempDir = () =>
  mkdtemp(path.join(os.tmpdir(), "galactic-workspace-cache-"));

test("workspace cache is unavailable until an active user is selected", async () => {
  const userDataPath = await createTempDir();
  const cacheDir = path.join(userDataPath, "galactic-workspaces");
  try {
    const cache = new UserScopedWorkspaceCache(cacheDir);
    assert.equal(cache.getActiveCacheDir(), null);
    await assert.rejects(
      () => cache.setActiveUser(""),
      /Workspace cache requires an active signed-in user/,
    );
  } finally {
    await rm(userDataPath, { recursive: true, force: true });
  }
});

test("first active user claims legacy workspace cache files", async () => {
  const userDataPath = await createTempDir();
  const cacheDir = path.join(userDataPath, "galactic-workspaces");
  const legacyFileName = "repo-abc123.code-workspace";
  await mkdir(cacheDir, { recursive: true });
  await writeFile(path.join(cacheDir, legacyFileName), "legacy", "utf-8");
  await writeFile(path.join(cacheDir, "notes.txt"), "ignore", "utf-8");

  try {
    const cache = new UserScopedWorkspaceCache(cacheDir);
    await cache.setActiveUser("user-1");

    assert.equal(
      await readFile(
        path.join(cacheDir, "users", "user-1", legacyFileName),
        "utf-8",
      ),
      "legacy",
    );
    assert.equal(
      existsSync(path.join(cacheDir, "users", "user-1", "notes.txt")),
      false,
    );

    await cache.setActiveUser("user-2");
    assert.equal(
      existsSync(path.join(cacheDir, "users", "user-2", legacyFileName)),
      false,
    );

    cache.clearActiveUser();
    assert.equal(cache.getActiveCacheDir(), null);
  } finally {
    await rm(userDataPath, { recursive: true, force: true });
  }
});

test("workspace cache migration preserves existing scoped files", async () => {
  const userDataPath = await createTempDir();
  const cacheDir = path.join(userDataPath, "galactic-workspaces");
  const legacyFileName = "repo-abc123.code-workspace";
  const scopedDir = path.join(cacheDir, "users", "user-1");
  await mkdir(scopedDir, { recursive: true });
  await writeFile(path.join(cacheDir, legacyFileName), "legacy", "utf-8");
  await writeFile(path.join(scopedDir, legacyFileName), "scoped", "utf-8");

  try {
    const cache = new UserScopedWorkspaceCache(cacheDir);
    await cache.setActiveUser("user-1");

    assert.equal(
      await readFile(path.join(scopedDir, legacyFileName), "utf-8"),
      "scoped",
    );
  } finally {
    await rm(userDataPath, { recursive: true, force: true });
  }
});
