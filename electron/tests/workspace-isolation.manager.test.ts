import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { WorkspaceIsolationManager } from "../workspace-isolation/manager.js";
import { REPOSITORY_ROOT_LABEL } from "../workspace-isolation/routing.js";
import type { WorkspaceIsolationConnection } from "../workspace-isolation/types.js";

const createTempDir = () => mkdtemp(path.join(os.tmpdir(), "galactic-isolation-manager-"));
type TestPortAllocator = (usedPorts: Set<number>) => Promise<number>;
const allocatePort = async (usedPorts: Set<number>) => {
  let port = 4310;
  while (usedPorts.has(port)) port += 1;
  usedPorts.add(port);
  return port;
};
const delayedAllocator = async (usedPorts: Set<number>) => {
  const port = usedPorts.has(4310) ? 4311 : 4310;
  await Promise.resolve();
  return port;
};
const createService = (
  id: string,
  relativePath: string,
  connections: WorkspaceIsolationConnection[] = [],
) => ({
  id,
  name: id,
  slug: id,
  relativePath,
  port: 0,
  createdAt: 1,
  connections,
});

const createTopologyInput = (
  projectId: string,
  projectName: string,
  workspaceRootPath: string,
  services: ReturnType<typeof createService>[],
) => ({
  name: projectName,
  projectId,
  workspaceRootPath,
  workspaceRootLabel: REPOSITORY_ROOT_LABEL,
  projectName,
  workspaceMode: "monorepo" as const,
  services,
});

const getStableHash = (value: string): string => {
  let hash = 7;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }
  return Math.abs(hash).toString(36).slice(0, 6).padStart(6, "0");
};

const getTopologyId = (projectId: string): string =>
  `project-${getStableHash(projectId)}`;

const createActiveManager = async (
  userDataPath: string,
  allocator: TestPortAllocator = allocatePort,
) => {
  const manager = new WorkspaceIsolationManager(userDataPath, "win32", allocator);
  await manager.setActiveUser("test-user", false);
  return manager;
};

test("saving a project topology does not enable any workspace by default", async () => {
  const userDataPath = await createTempDir();
  const repoPath = path.join(userDataPath, "repo");
  const featurePath = path.join(userDataPath, "feature-a");
  await mkdir(repoPath, { recursive: true });
  await mkdir(featurePath, { recursive: true });
  const manager = await createActiveManager(userDataPath);
  try {
    await manager.saveProjectTopology(createTopologyInput("project-1", "shop", repoPath, [createService("api", "apps/api")]));
    assert.equal(manager.getProjectTopologies().length, 1);
    assert.equal(manager.getStacks().length, 0);

    await manager.enableWorkspace({
      projectId: "project-1",
      projectName: "shop",
      workspaceRootPath: featurePath,
      workspaceRootLabel: "feature-a",
    });
    assert.deepEqual(manager.getStacks().map((stack) => stack.workspaceRootLabel), ["feature-a"]);
  } finally {
    await rm(userDataPath, { recursive: true, force: true });
  }
});
test("enabled services receive unique ports from delayed allocators", async () => {
  const userDataPath = await createTempDir();
  const repoPath = path.join(userDataPath, "repo");
  await mkdir(repoPath, { recursive: true });
  const manager = await createActiveManager(userDataPath, delayedAllocator);
  try {
    await manager.saveProjectTopology(
      createTopologyInput("project-1", "shop", repoPath, [
        createService("api", "apps/api"),
        createService("web", "apps/web"),
      ]),
    );
    await manager.enableWorkspace({
      projectId: "project-1",
      projectName: "shop",
      workspaceRootPath: repoPath,
      workspaceRootLabel: REPOSITORY_ROOT_LABEL,
    });
    const ports = manager.getStacks()[0]?.services.map((service) => service.port);
    assert.deepEqual(ports, [4310, 4311]);
  } finally {
    await rm(userDataPath, { recursive: true, force: true });
  }
});

test("editing a topology updates every enabled workspace and preserves unchanged ports", async () => {
  const userDataPath = await createTempDir();
  const repoPath = path.join(userDataPath, "repo");
  const featurePath = path.join(userDataPath, "feature-b");
  await mkdir(repoPath, { recursive: true });
  await mkdir(featurePath, { recursive: true });
  const manager = await createActiveManager(userDataPath);
  try {
    await manager.saveProjectTopology(createTopologyInput("project-1", "shop", repoPath, [createService("api", "apps/api"), createService("web", "apps/web")]));
    await manager.enableWorkspace({ projectId: "project-1", projectName: "shop", workspaceRootPath: repoPath, workspaceRootLabel: REPOSITORY_ROOT_LABEL });
    await manager.enableWorkspace({ projectId: "project-1", projectName: "shop", workspaceRootPath: featurePath, workspaceRootLabel: "feature-b" });
    const apiPorts = new Map(manager.getStacks().map((stack) => [stack.workspaceRootPath, stack.services.find((service) => service.id === "api")?.port]));
    await manager.saveProjectTopology(createTopologyInput("project-1", "shop", repoPath, [createService("api", "apps/api"), createService("worker", "apps/worker")]));
    manager.getStacks().forEach((stack) => {
      assert.deepEqual(stack.services.map((service) => service.id), ["api", "worker"]);
      assert.equal(stack.services.find((service) => service.id === "api")?.port, apiPorts.get(stack.workspaceRootPath));
      assert.equal(Boolean(stack.services.find((service) => service.id === "worker")?.port), true);
    });
  } finally {
    await rm(userDataPath, { recursive: true, force: true });
  }
});
test("getStacks returns cloned connection objects", async () => {
  const userDataPath = await createTempDir();
  const repoPath = path.join(userDataPath, "repo");
  await mkdir(repoPath, { recursive: true });
  const manager = await createActiveManager(userDataPath);
  try {
    await manager.saveProjectTopology(
      createTopologyInput("project-1", "shop", repoPath, [
        createService("api", "apps/api", [
          {
            id: "connection-1",
            envKey: "WEB_URL",
            targetStackId: "target-stack",
            targetServiceId: "web",
          },
        ]),
      ]),
    );
    await manager.enableWorkspace({
      projectId: "project-1",
      projectName: "shop",
      workspaceRootPath: repoPath,
      workspaceRootLabel: REPOSITORY_ROOT_LABEL,
    });
    const firstRead = manager.getStacks();
    const connection = firstRead[0]?.services[0]?.connections[0];
    assert.ok(connection);
    connection.envKey = "MUTATED";
    assert.equal(manager.getStacks()[0]?.services[0]?.connections[0]?.envKey, "WEB_URL");
  } finally {
    await rm(userDataPath, { recursive: true, force: true });
  }
});

test("external topology connections prefer the same workspace label and then repository root", async () => {
  const userDataPath = await createTempDir();
  const repoA = path.join(userDataPath, "repo-a");
  const repoB = path.join(userDataPath, "repo-b");
  const featureA = path.join(userDataPath, "feature-a");
  const featureB = path.join(userDataPath, "feature-b");
  await Promise.all([repoA, repoB, featureA, featureB].map((target) => mkdir(target, { recursive: true })));
  const manager = await createActiveManager(userDataPath);
  try {
    await manager.saveProjectTopology(createTopologyInput("project-b", "billing", repoB, [createService("web", "apps/web")]));
    const topologyBId = manager.getProjectTopologies().find((topology) => topology.projectId === "project-b")?.id ?? "";
    await manager.saveProjectTopology(createTopologyInput("project-a", "shop", repoA, [createService("api", "apps/api", [{ id: "connection-1", envKey: "WEB_URL", targetStackId: topologyBId, targetServiceId: "web" }])]));
    await manager.enableWorkspace({ projectId: "project-b", projectName: "billing", workspaceRootPath: repoB, workspaceRootLabel: REPOSITORY_ROOT_LABEL });
    await manager.enableWorkspace({ projectId: "project-a", projectName: "shop", workspaceRootPath: featureA, workspaceRootLabel: "feature-a" });
    const getTargetStackId = () =>
      manager.getStacks()
        .find((stack) => stack.projectId === "project-a" && stack.workspaceRootLabel === "feature-a")
        ?.services[0]?.connections[0]?.targetStackId;
    const rootTargetId = manager.getStacks().find((stack) => stack.projectId === "project-b" && stack.workspaceRootLabel === REPOSITORY_ROOT_LABEL)?.id;
    assert.equal(getTargetStackId(), rootTargetId);
    await manager.enableWorkspace({ projectId: "project-b", projectName: "billing", workspaceRootPath: featureB, workspaceRootLabel: "feature-a" });
    const matchingTargetId = manager.getStacks().find((stack) => stack.projectId === "project-b" && stack.workspaceRootLabel === "feature-a")?.id;
    assert.equal(getTargetStackId(), matchingTargetId);
  } finally {
    await rm(userDataPath, { recursive: true, force: true });
  }
});
test("deleting a topology removes every enabled workspace for that project", async () => {
  const userDataPath = await createTempDir();
  const repoPath = path.join(userDataPath, "repo");
  const featurePath = path.join(userDataPath, "feature-c");
  await mkdir(repoPath, { recursive: true });
  await mkdir(featurePath, { recursive: true });
  const manager = await createActiveManager(userDataPath);
  try {
    await manager.saveProjectTopology(createTopologyInput("project-1", "shop", repoPath, [createService("api", "apps/api")]));
    const topologyId = manager.getProjectTopologies()[0]?.id ?? "";
    await manager.enableWorkspace({ projectId: "project-1", projectName: "shop", workspaceRootPath: repoPath, workspaceRootLabel: REPOSITORY_ROOT_LABEL });
    await manager.enableWorkspace({ projectId: "project-1", projectName: "shop", workspaceRootPath: featurePath, workspaceRootLabel: "feature-c" });
    assert.equal(manager.getStacks().length, 2);
    await manager.deleteProjectTopology(topologyId);
    assert.equal(manager.getProjectTopologies().length, 0);
    assert.equal(manager.getStacks().length, 0);
  } finally {
    await rm(userDataPath, { recursive: true, force: true });
  }
});

test("Project Services mutations require an active user", async () => {
  const userDataPath = await createTempDir();
  const repoPath = path.join(userDataPath, "repo");
  await mkdir(repoPath, { recursive: true });
  const manager = new WorkspaceIsolationManager(userDataPath, "win32", allocatePort);
  try {
    const saveResult = await manager.saveProjectTopology(
      createTopologyInput("project-1", "shop", repoPath, [
        createService("api", "apps/api"),
      ]),
    );
    const enableResult = await manager.enableWorkspace({
      projectId: "project-1",
      projectName: "shop",
      workspaceRootPath: repoPath,
      workspaceRootLabel: REPOSITORY_ROOT_LABEL,
    });

    assert.equal(saveResult.success, false);
    assert.equal(enableResult.success, false);
    assert.throws(
      () => manager.getProjectTopologies(),
      /Project Services storage requires an active signed-in user/,
    );
    assert.throws(
      () => manager.getStacks(),
      /Project Services storage requires an active signed-in user/,
    );
    await assert.rejects(
      () => manager.setActiveUser("", false),
      /Project Services storage requires an active signed-in user/,
    );
  } finally {
    await rm(userDataPath, { recursive: true, force: true });
  }
});

test("first active user claims legacy Workspace Isolation store", async () => {
  const userDataPath = await createTempDir();
  const repoPath = path.join(userDataPath, "repo");
  await mkdir(repoPath, { recursive: true });
  try {
    const legacyStorePath = path.join(
      userDataPath,
      "workspace-isolation",
      "stacks.json",
    );
    await mkdir(path.dirname(legacyStorePath), { recursive: true });
    await writeFile(
      legacyStorePath,
      JSON.stringify(
        {
          topologies: [
            createTopologyInput("project-1", "shop", repoPath, [
              createService("api", "apps/api"),
            ]),
          ],
          enabledWorkspaces: [
            {
              createdAt: 1,
              id: repoPath,
              projectId: "project-1",
              projectName: "shop",
              servicePorts: {},
              topologyId: getTopologyId("project-1"),
              workspaceRootLabel: REPOSITORY_ROOT_LABEL,
              workspaceRootPath: repoPath,
            },
          ],
        },
        null,
        2,
      ),
      "utf-8",
    );

    const manager = new WorkspaceIsolationManager(userDataPath, "win32", allocatePort);
    await manager.setActiveUser("user-1", false);
    assert.deepEqual(
      manager.getProjectTopologies().map((topology) => topology.projectId),
      ["project-1"],
    );
    assert.deepEqual(
      manager.getStacks().map((stack) => stack.projectId),
      ["project-1"],
    );

    await manager.setActiveUser("user-2", false);
    assert.equal(manager.getProjectTopologies().length, 0);
    assert.equal(manager.getStacks().length, 0);

    await manager.clearActiveUser(false);
    assert.throws(
      () => manager.getProjectTopologies(),
      /Project Services storage requires an active signed-in user/,
    );
    assert.throws(
      () => manager.getStacks(),
      /Project Services storage requires an active signed-in user/,
    );

    await manager.setActiveUser("user-1", false);
    assert.deepEqual(
      manager.getProjectTopologies().map((topology) => topology.projectId),
      ["project-1"],
    );
  } finally {
    await rm(userDataPath, { recursive: true, force: true });
  }
});

test("Workspace Isolation migration does not overwrite existing scoped store", async () => {
  const userDataPath = await createTempDir();
  const legacyRepoPath = path.join(userDataPath, "legacy-repo");
  const scopedRepoPath = path.join(userDataPath, "scoped-repo");
  await Promise.all([
    mkdir(legacyRepoPath, { recursive: true }),
    mkdir(scopedRepoPath, { recursive: true }),
  ]);
  try {
    const legacyStorePath = path.join(
      userDataPath,
      "workspace-isolation",
      "stacks.json",
    );
    await mkdir(path.dirname(legacyStorePath), { recursive: true });
    await writeFile(
      legacyStorePath,
      JSON.stringify(
        {
          topologies: [
            createTopologyInput("legacy-project", "legacy", legacyRepoPath, [
              createService("api", "apps/api"),
            ]),
          ],
          enabledWorkspaces: [],
        },
        null,
        2,
      ),
      "utf-8",
    );

    const scopedStorePath = path.join(
      userDataPath,
      "workspace-isolation",
      "users",
      "user-1",
      "stacks.json",
    );
    await mkdir(path.dirname(scopedStorePath), { recursive: true });
    await writeFile(
      scopedStorePath,
      JSON.stringify(
        {
          topologies: [
            createTopologyInput("scoped-project", "scoped", scopedRepoPath, [
              createService("web", "apps/web"),
            ]),
          ],
          enabledWorkspaces: [],
        },
        null,
        2,
      ),
      "utf-8",
    );

    const manager = new WorkspaceIsolationManager(userDataPath, "win32", allocatePort);
    await manager.setActiveUser("user-1", false);
    assert.deepEqual(
      manager.getProjectTopologies().map((topology) => topology.projectId),
      ["scoped-project"],
    );
  } finally {
    await rm(userDataPath, { recursive: true, force: true });
  }
});
