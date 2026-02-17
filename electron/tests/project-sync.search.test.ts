import assert from "node:assert/strict";
import { promises as fsPromises } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { searchSyncTargetsInProject } from "../project-sync/search.js";

const createSearchFixture = async (): Promise<string> => {
  const root = await fsPromises.mkdtemp(path.join(os.tmpdir(), "galactic-sync-search-"));
  await fsPromises.mkdir(path.join(root, ".git"), { recursive: true });
  await fsPromises.mkdir(path.join(root, "node_modules", "pkg"), { recursive: true });
  await fsPromises.mkdir(path.join(root, "worktrees", "feature"), { recursive: true });
  await fsPromises.mkdir(path.join(root, "config", "nested"), { recursive: true });
  await fsPromises.mkdir(path.join(root, "env-folder"), { recursive: true });
  await fsPromises.writeFile(path.join(root, ".env"), "ROOT=true\n", "utf-8");
  await fsPromises.writeFile(path.join(root, "config", "nested", "app.json"), "{\"name\":\"app\"}\n", "utf-8");
  await fsPromises.writeFile(path.join(root, "env-folder", ".env.local"), "LOCAL=true\n", "utf-8");
  await fsPromises.writeFile(path.join(root, ".git", "HEAD"), "ref: refs/heads/main\n", "utf-8");
  await fsPromises.writeFile(path.join(root, "node_modules", "pkg", "index.js"), "module.exports={};\n", "utf-8");
  await fsPromises.writeFile(path.join(root, "worktrees", "feature", ".env"), "IGNORED=true\n", "utf-8");
  return root;
};

test("searchSyncTargetsInProject includes node_modules/worktrees while excluding .git", async (t) => {
  const root = await createSearchFixture();
  t.after(async () => {
    await fsPromises.rm(root, { recursive: true, force: true });
  });

  const results = await searchSyncTargetsInProject(root, "");
  const keys = new Set(results.map((result) => `${result.kind}:${result.path}`));

  assert.equal(keys.has("file:.env"), true);
  assert.equal(keys.has("directory:config"), true);
  assert.equal(keys.has("directory:env-folder"), true);
  assert.equal(keys.has("file:env-folder/.env.local"), true);
  assert.equal(keys.has("directory:node_modules"), true);
  assert.equal(keys.has("file:node_modules/pkg/index.js"), true);
  assert.equal(keys.has("directory:worktrees"), true);
  assert.equal(keys.has("file:worktrees/feature/.env"), true);
  assert.equal([...keys].some((entry) => entry.includes(".git")), false);
});

test("searchSyncTargetsInProject applies query filtering and result caps", async (t) => {
  const root = await createSearchFixture();
  t.after(async () => {
    await fsPromises.rm(root, { recursive: true, force: true });
  });

  const envResults = await searchSyncTargetsInProject(root, "env");
  assert.equal(envResults.length > 0, true);
  assert.equal(envResults.every((result) => result.path.toLowerCase().includes("env")), true);

  const cappedResults = await searchSyncTargetsInProject(root, "", { maxResults: 2 });
  assert.equal(cappedResults.length, 2);
});
