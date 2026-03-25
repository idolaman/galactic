import assert from "node:assert/strict";
import { promises as fsPromises } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { copySyncTargetsToWorktree } from "../project-sync/copy.js";
import type { SyncTarget } from "../project-sync/types.js";

const createFixture = async () => {
  const sourceRoot = await fsPromises.mkdtemp(path.join(os.tmpdir(), "galactic-sync-symlink-src-"));
  const destinationRoot = await fsPromises.mkdtemp(path.join(os.tmpdir(), "galactic-sync-symlink-dst-"));
  return { sourceRoot, destinationRoot };
};

const createSymlink = async (targetPath: string, linkPath: string, type: "file" | "dir"): Promise<boolean> => {
  try {
    await fsPromises.symlink(targetPath, linkPath, type);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EPERM") {
      return false;
    }
    throw error;
  }
};

test("copySyncTargetsToWorktree preserves direct file symlinks", async (t) => {
  const { sourceRoot, destinationRoot } = await createFixture();
  t.after(async () => {
    await fsPromises.rm(sourceRoot, { recursive: true, force: true });
    await fsPromises.rm(destinationRoot, { recursive: true, force: true });
  });

  await fsPromises.mkdir(path.join(sourceRoot, "shared"), { recursive: true });
  await fsPromises.writeFile(path.join(sourceRoot, "shared", "config.env"), "LINKED=true\n", "utf-8");
  const linkTarget = path.join("shared", "config.env");
  if (!(await createSymlink(linkTarget, path.join(sourceRoot, "linked.env"), "file"))) {
    t.skip("Symlink creation is unavailable in this environment.");
    return;
  }

  const targets: SyncTarget[] = [{ path: "shared/config.env", kind: "file" }, { path: "linked.env", kind: "file" }];
  const result = await copySyncTargetsToWorktree(sourceRoot, destinationRoot, targets);
  assert.equal(result.success, true);
  assert.equal((await fsPromises.lstat(path.join(destinationRoot, "linked.env"))).isSymbolicLink(), true);
  assert.equal(await fsPromises.readlink(path.join(destinationRoot, "linked.env")), linkTarget);
  assert.equal(await fsPromises.readFile(path.join(destinationRoot, "linked.env"), "utf-8"), "LINKED=true\n");
});

test("copySyncTargetsToWorktree preserves node_modules-style directory symlinks", async (t) => {
  const { sourceRoot, destinationRoot } = await createFixture();
  t.after(async () => {
    await fsPromises.rm(sourceRoot, { recursive: true, force: true });
    await fsPromises.rm(destinationRoot, { recursive: true, force: true });
  });

  const packageRoot = path.join(sourceRoot, "node_modules", ".pnpm", "pkg", "node_modules", "pkg");
  await fsPromises.mkdir(packageRoot, { recursive: true });
  await fsPromises.writeFile(path.join(packageRoot, "index.js"), "module.exports = {};\n", "utf-8");
  const linkTarget = path.join(".pnpm", "pkg", "node_modules", "pkg");
  if (!(await createSymlink(linkTarget, path.join(sourceRoot, "node_modules", "pkg"), "dir"))) {
    t.skip("Symlink creation is unavailable in this environment.");
    return;
  }

  const targets: SyncTarget[] = [{ path: "node_modules", kind: "directory" }];
  const result = await copySyncTargetsToWorktree(sourceRoot, destinationRoot, targets);
  assert.equal(result.success, true);
  assert.equal((await fsPromises.lstat(path.join(destinationRoot, "node_modules", "pkg"))).isSymbolicLink(), true);
  assert.equal(await fsPromises.readlink(path.join(destinationRoot, "node_modules", "pkg")), linkTarget);
  assert.equal(await fsPromises.readFile(path.join(destinationRoot, "node_modules", "pkg", "index.js"), "utf-8"), "module.exports = {};\n");
});
