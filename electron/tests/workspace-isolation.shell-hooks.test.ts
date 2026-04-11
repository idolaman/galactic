import assert from "node:assert/strict";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { syncWorkspaceIsolationShellFiles } from "../workspace-isolation/shell-hooks.js";

const createTempDir = () => mkdtemp(path.join(os.tmpdir(), "galactic-workspace-isolation-"));

const stacks = [{
  id: "stack-1",
  kind: "workspace-isolation" as const,
  name: "demo",
  slug: "demo",
  projectId: "project-1",
  workspaceRootPath: "/repo",
  workspaceRootLabel: "Repository Root",
  projectName: "demo",
  workspaceMode: "monorepo" as const,
  createdAt: 1,
  services: [
    {
      id: "api",
      name: "api",
      slug: "api",
      relativePath: "apps/api",
      port: 4310,
      createdAt: 1,
      connections: [{
        id: "connection-1",
        envKey: "WEB_URL",
        targetStackId: "stack-1",
        targetServiceId: "web",
      }],
    },
    {
      id: "web",
      name: "web",
      slug: "web",
      relativePath: ".",
      port: 4311,
      createdAt: 1,
      connections: [],
    },
  ],
}];

test("syncWorkspaceIsolationShellFiles installs and removes the managed zsh block", async () => {
  const stateDir = await createTempDir();
  const homeDir = await createTempDir();

  try {
    const enabledStatus = await syncWorkspaceIsolationShellFiles(
      stateDir,
      stacks,
      true,
      "darwin",
      homeDir,
    );
    assert.equal(enabledStatus.enabled, true);
    assert.equal(enabledStatus.installed, true);
    assert.ok(enabledStatus.hookPath);
    assert.ok(enabledStatus.zshrcPath);

    const zshrc = await readFile(path.join(homeDir, ".zshrc"), "utf-8");
    assert.match(zshrc, /Galactic Workspace Isolation/);

    const stateFile = await readFile(path.join(stateDir, "shell", "workspace-isolation-state.zsh"), "utf-8");
    assert.match(stateFile, /\/repo/);
    assert.match(stateFile, /HOST\t127\.0\.0\.1/);
    assert.match(stateFile, /WEB_URL\thttp:\/\/web\.root\.demo\.localhost:1355/);
    await assert.rejects(access(path.join(stateDir, "shell", "registry.json")));

    await syncWorkspaceIsolationShellFiles(stateDir, stacks, false, "darwin", homeDir);
    const disabledZshrc = await readFile(path.join(homeDir, ".zshrc"), "utf-8");
    assert.doesNotMatch(disabledZshrc, /Galactic Workspace Isolation/);
  } finally {
    await rm(stateDir, { recursive: true, force: true });
    await rm(homeDir, { recursive: true, force: true });
  }
});
