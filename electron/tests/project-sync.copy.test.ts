import assert from "node:assert/strict";
import { promises as fsPromises } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { copySyncTargetsToWorktree } from "../project-sync/copy.js";
import type { SyncTarget } from "../project-sync/types.js";

const createCopyFixture = async () => {
  const sourceRoot = await fsPromises.mkdtemp(path.join(os.tmpdir(), "galactic-sync-copy-src-"));
  const destinationRoot = await fsPromises.mkdtemp(path.join(os.tmpdir(), "galactic-sync-copy-dst-"));

  await fsPromises.mkdir(path.join(sourceRoot, "config", "nested"), { recursive: true });
  await fsPromises.writeFile(path.join(sourceRoot, ".env"), "SOURCE=true\n", "utf-8");
  await fsPromises.writeFile(path.join(sourceRoot, "config", "app.json"), "{\"version\":1}\n", "utf-8");
  await fsPromises.writeFile(path.join(sourceRoot, "config", "nested", "secret.env"), "SECRET=true\n", "utf-8");
  await fsPromises.mkdir(path.join(destinationRoot, "config"), { recursive: true });
  await fsPromises.writeFile(path.join(destinationRoot, ".env"), "DESTINATION=true\n", "utf-8");
  await fsPromises.writeFile(path.join(destinationRoot, "config", "app.json"), "{\"version\":0}\n", "utf-8");
  await fsPromises.writeFile(path.join(destinationRoot, "config", "stale.env"), "STALE=true\n", "utf-8");

  return { sourceRoot, destinationRoot };
};

test("copySyncTargetsToWorktree replaces existing files and directories", async (t) => {
  const { sourceRoot, destinationRoot } = await createCopyFixture();
  t.after(async () => {
    await fsPromises.rm(sourceRoot, { recursive: true, force: true });
    await fsPromises.rm(destinationRoot, { recursive: true, force: true });
  });

  const targets: SyncTarget[] = [
    { path: ".env", kind: "file" },
    { path: "config", kind: "directory" },
    { path: "config/app.json", kind: "file" },
  ];

  const result = await copySyncTargetsToWorktree(sourceRoot, destinationRoot, targets);
  assert.equal(result.success, true);
  assert.deepEqual(result.skipped, []);
  assert.equal(result.copied.includes(".env"), true);
  assert.equal(result.copied.includes("config/app.json"), true);
  assert.equal(result.copied.includes("config/nested/secret.env"), true);
  assert.equal(result.copied.filter((entry) => entry === "config/app.json").length, 1);

  const existingEnvContent = await fsPromises.readFile(path.join(destinationRoot, ".env"), "utf-8");
  assert.equal(existingEnvContent, "SOURCE=true\n");
  const copiedConfig = await fsPromises.readFile(path.join(destinationRoot, "config", "app.json"), "utf-8");
  assert.equal(copiedConfig, "{\"version\":1}\n");
  await assert.rejects(fsPromises.access(path.join(destinationRoot, "config", "stale.env")));
});

test("copySyncTargetsToWorktree reports invalid paths as errors", async (t) => {
  const { sourceRoot, destinationRoot } = await createCopyFixture();
  t.after(async () => {
    await fsPromises.rm(sourceRoot, { recursive: true, force: true });
    await fsPromises.rm(destinationRoot, { recursive: true, force: true });
  });

  const result = await copySyncTargetsToWorktree(sourceRoot, destinationRoot, [{ path: "../outside", kind: "file" }]);
  assert.equal(result.success, false);
  assert.equal(result.copied.length, 0);
  assert.equal(result.skipped.length, 0);
  assert.equal((result.errors?.length ?? 0) > 0, true);
});

test("copySyncTargetsToWorktree lets parent directories win over nested selections", async (t) => {
  const { sourceRoot, destinationRoot } = await createCopyFixture();
  t.after(async () => {
    await fsPromises.rm(sourceRoot, { recursive: true, force: true });
    await fsPromises.rm(destinationRoot, { recursive: true, force: true });
  });

  const targets: SyncTarget[] = [
    { path: "config", kind: "directory" },
    { path: "config/nested", kind: "directory" },
    { path: "config/app.json", kind: "file" },
  ];

  const result = await copySyncTargetsToWorktree(sourceRoot, destinationRoot, targets);
  assert.equal(result.success, true);
  assert.equal(result.copied.includes("config/app.json"), true);
  assert.equal(result.copied.includes("config/nested/secret.env"), true);
  assert.equal(result.copied.filter((entry) => entry === "config/nested/secret.env").length, 1);
  assert.equal(result.copied.length, 2);
});

test("copySyncTargetsToWorktree preserves direct symlink targets", async (t) => {
  const sourceRoot = await fsPromises.mkdtemp(path.join(os.tmpdir(), "galactic-sync-link-src-"));
  const destinationRoot = await fsPromises.mkdtemp(path.join(os.tmpdir(), "galactic-sync-link-dst-"));
  t.after(async () => {
    await fsPromises.rm(sourceRoot, { recursive: true, force: true });
    await fsPromises.rm(destinationRoot, { recursive: true, force: true });
  });

  await fsPromises.writeFile(path.join(sourceRoot, ".env"), "SOURCE=true\n", "utf-8");
  await fsPromises.symlink(".env", path.join(sourceRoot, "current.env"));
  await fsPromises.writeFile(path.join(destinationRoot, "current.env"), "stale\n", "utf-8");

  const result = await copySyncTargetsToWorktree(sourceRoot, destinationRoot, [{ path: "current.env", kind: "file" }]);
  assert.equal(result.success, true);
  assert.deepEqual(result.copied, ["current.env"]);

  const copiedStats = await fsPromises.lstat(path.join(destinationRoot, "current.env"));
  assert.equal(copiedStats.isSymbolicLink(), true);
  assert.equal(await fsPromises.readlink(path.join(destinationRoot, "current.env")), ".env");
});

test("copySyncTargetsToWorktree preserves nested symlinks in directory targets copied with ditto", async (t) => {
  const sourceRoot = await fsPromises.mkdtemp(path.join(os.tmpdir(), "galactic-sync-dir-link-src-"));
  const destinationRoot = await fsPromises.mkdtemp(path.join(os.tmpdir(), "galactic-sync-dir-link-dst-"));
  t.after(async () => {
    await fsPromises.rm(sourceRoot, { recursive: true, force: true });
    await fsPromises.rm(destinationRoot, { recursive: true, force: true });
  });

  await fsPromises.mkdir(path.join(sourceRoot, "config"), { recursive: true });
  await fsPromises.writeFile(path.join(sourceRoot, "config", "app.json"), "{\"version\":1}\n", "utf-8");
  await fsPromises.symlink("app.json", path.join(sourceRoot, "config", "current.json"));
  await fsPromises.writeFile(path.join(destinationRoot, "config"), "stale\n", "utf-8");

  const result = await copySyncTargetsToWorktree(sourceRoot, destinationRoot, [{ path: "config", kind: "directory" }]);
  assert.equal(result.success, true);
  assert.deepEqual(result.copied, ["config/app.json", "config/current.json"]);

  const copiedStats = await fsPromises.lstat(path.join(destinationRoot, "config", "current.json"));
  assert.equal(copiedStats.isSymbolicLink(), true);
  assert.equal(await fsPromises.readlink(path.join(destinationRoot, "config", "current.json")), "app.json");
});
