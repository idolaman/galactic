import assert from "node:assert/strict";
import { promises as fsPromises } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { copySyncTargetsToWorktree } from "../project-sync/copy.js";
import type { SyncTarget } from "../project-sync/types.js";

const createFixture = async () => {
  const sourceRoot = await fsPromises.mkdtemp(path.join(os.tmpdir(), "galactic-sync-unsafe-src-"));
  const destinationRoot = await fsPromises.mkdtemp(path.join(os.tmpdir(), "galactic-sync-unsafe-dst-"));
  return { sourceRoot, destinationRoot };
};

test("copySyncTargetsToWorktree allows atomic Electron runtime directory sync", async (t) => {
  const { sourceRoot, destinationRoot } = await createFixture();
  t.after(async () => {
    await fsPromises.rm(sourceRoot, { recursive: true, force: true });
    await fsPromises.rm(destinationRoot, { recursive: true, force: true });
  });

  const electronRuntimeRoot = path.join(sourceRoot, "node_modules", "electron", "dist", "Electron.app", "Contents", "Resources");
  await fsPromises.mkdir(electronRuntimeRoot, { recursive: true });
  await fsPromises.writeFile(path.join(electronRuntimeRoot, "default_app.asar"), "runtime", "utf-8");
  await fsPromises.writeFile(path.join(sourceRoot, "node_modules", "electron", "LICENSE"), "license", "utf-8");

  const targets: SyncTarget[] = [{ path: "node_modules/electron", kind: "directory" }];
  const result = await copySyncTargetsToWorktree(sourceRoot, destinationRoot, targets);

  assert.equal(result.success, true);
  assert.equal(result.copied.includes("node_modules/electron/dist/Electron.app/Contents/Resources/default_app.asar"), true);
  assert.equal(
    await fsPromises.readFile(
      path.join(destinationRoot, "node_modules", "electron", "dist", "Electron.app", "Contents", "Resources", "default_app.asar"),
      "utf-8",
    ),
    "runtime",
  );
});

test("copySyncTargetsToWorktree syncs nested macOS app bundles inside selected folders", async (t) => {
  const { sourceRoot, destinationRoot } = await createFixture();
  t.after(async () => {
    await fsPromises.rm(sourceRoot, { recursive: true, force: true });
    await fsPromises.rm(destinationRoot, { recursive: true, force: true });
  });

  const appBundleResources = path.join(sourceRoot, "Applications", "Test.app", "Contents", "Resources");
  await fsPromises.mkdir(appBundleResources, { recursive: true });
  await fsPromises.writeFile(path.join(sourceRoot, "Applications", "README.txt"), "safe", "utf-8");
  await fsPromises.writeFile(path.join(appBundleResources, "boot.dat"), "unsafe", "utf-8");

  const targets: SyncTarget[] = [{ path: "Applications", kind: "directory" }];
  const result = await copySyncTargetsToWorktree(sourceRoot, destinationRoot, targets);

  assert.equal(result.success, true);
  assert.deepEqual(result.copied, ["Applications/README.txt", "Applications/Test.app/Contents/Resources/boot.dat"]);
  assert.equal(
    await fsPromises.readFile(path.join(destinationRoot, "Applications", "Test.app", "Contents", "Resources", "boot.dat"), "utf-8"),
    "unsafe",
  );
});
