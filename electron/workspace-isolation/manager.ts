import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { createWorkspaceIsolationProxy } from "./proxy.js";
import { getNextAvailableServicePort } from "./ports.js";
import {
  REPOSITORY_ROOT_LABEL,
  buildStoredStack,
  buildWorkspaceIsolationHostname,
  normalizeRelativeServicePath,
  normalizeWorkspaceRootPath,
  toSlug,
} from "./routing.js";
import { syncWorkspaceIsolationShellFiles } from "./shell-hooks.js";
import type {
  EnableWorkspaceIsolationInput,
  SaveWorkspaceIsolationInput,
  WorkspaceIsolationEnabledWorkspace,
  WorkspaceIsolationMutationResult,
  WorkspaceIsolationProjectTopology,
  WorkspaceIsolationProxyStatus,
  WorkspaceIsolationRoute,
  WorkspaceIsolationShellHookStatus,
  WorkspaceIsolationStack,
  WorkspaceIsolationTopologyMutationResult,
} from "./types.js";

const STORE_FILE_NAME = "stacks.json";
const USER_STORES_DIR_NAME = "users";
const MIGRATION_CLAIM_FILE_NAME = "migration-v1-claimed-by";
const PROXY_PORT = 1355;
type PortAllocator = (usedPorts: Set<number>) => Promise<number>;

interface WorkspaceIsolationStore {
  topologies: WorkspaceIsolationProjectTopology[];
  enabledWorkspaces: WorkspaceIsolationEnabledWorkspace[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const createEmptyStore = (): WorkspaceIsolationStore => ({
  topologies: [],
  enabledWorkspaces: [],
});

const normalizeUserId = (userId: string | null | undefined): string | null => {
  const normalized = userId?.trim();
  return normalized ? normalized : null;
};

const toUserStorageSegment = (userId: string): string =>
  encodeURIComponent(userId);

const getStableHash = (value: string): string => {
  let hash = 7;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }
  return Math.abs(hash).toString(36).slice(0, 6).padStart(6, "0");
};

const cloneServices = (services: WorkspaceIsolationStack["services"]) =>
  services.map((service) => ({
    ...service,
    connections: service.connections.map((connection) => ({ ...connection })),
  }));

const cloneStack = <T extends WorkspaceIsolationStack>(stack: T): T => ({
  ...stack,
  services: cloneServices(stack.services),
});

const cloneEnabledWorkspace = (
  workspace: WorkspaceIsolationEnabledWorkspace,
): WorkspaceIsolationEnabledWorkspace => ({
  ...workspace,
  servicePorts: { ...workspace.servicePorts },
});

const cloneStore = (store: WorkspaceIsolationStore): WorkspaceIsolationStore => ({
  topologies: store.topologies.map(cloneStack),
  enabledWorkspaces: store.enabledWorkspaces.map(cloneEnabledWorkspace),
});

const getTopologyId = (projectId: string): string =>
  `project-${getStableHash(projectId)}`;

const getEnabledWorkspaceId = (workspaceRootPath: string): string =>
  normalizeWorkspaceRootPath(workspaceRootPath);

const getWorkspaceIsolationName = (
  projectName: string,
  workspaceRootLabel: string,
): string =>
  workspaceRootLabel === REPOSITORY_ROOT_LABEL
    ? projectName
    : workspaceRootLabel;

const normalizeServices = (
  value: unknown,
): WorkspaceIsolationStack["services"] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((serviceValue) => {
    if (!isRecord(serviceValue) || typeof serviceValue.id !== "string") {
      return [];
    }

    const connections = Array.isArray(serviceValue.connections)
      ? serviceValue.connections.filter(
          (connection): connection is WorkspaceIsolationStack["services"][number]["connections"][number] =>
            isRecord(connection) &&
            typeof connection.id === "string" &&
            typeof connection.envKey === "string" &&
            typeof connection.targetStackId === "string" &&
            typeof connection.targetServiceId === "string",
        )
      : [];

    return [
      {
        id: serviceValue.id,
        name: typeof serviceValue.name === "string" ? serviceValue.name : "",
        slug: typeof serviceValue.slug === "string" ? serviceValue.slug : "",
        relativePath:
          typeof serviceValue.relativePath === "string"
            ? normalizeRelativeServicePath(serviceValue.relativePath)
            : ".",
        port:
          typeof serviceValue.port === "number" ? serviceValue.port : 0,
        createdAt:
          typeof serviceValue.createdAt === "number"
            ? serviceValue.createdAt
            : Date.now(),
        connections,
      },
    ];
  });
};

const normalizeTopology = (
  value: unknown,
): WorkspaceIsolationProjectTopology[] => {
  if (
    !isRecord(value) ||
    typeof value.projectId !== "string" ||
    typeof value.name !== "string" ||
    typeof value.workspaceRootPath !== "string" ||
    typeof value.workspaceRootLabel !== "string" ||
    typeof value.projectName !== "string"
  ) {
    return [];
  }

  const services = normalizeServices(value.services);
  const topologyId = getTopologyId(value.projectId);
  const input: SaveWorkspaceIsolationInput = {
    name: value.name,
    projectId: value.projectId,
    workspaceRootPath: normalizeWorkspaceRootPath(value.workspaceRootPath),
    workspaceRootLabel: value.workspaceRootLabel,
    projectName: value.projectName,
    workspaceMode: value.workspaceMode === "single-app" ? "single-app" : "monorepo",
    services,
  };

  return [
    buildStoredStack(
      input,
      topologyId,
      services,
      typeof value.createdAt === "number" ? value.createdAt : Date.now(),
    ),
  ];
};

const normalizeEnabledWorkspace = (
  value: unknown,
): WorkspaceIsolationEnabledWorkspace[] => {
  if (
    !isRecord(value) ||
    typeof value.topologyId !== "string" ||
    typeof value.projectId !== "string" ||
    typeof value.projectName !== "string" ||
    typeof value.workspaceRootPath !== "string" ||
    typeof value.workspaceRootLabel !== "string"
  ) {
    return [];
  }

  const servicePorts = isRecord(value.servicePorts)
    ? Object.fromEntries(
        Object.entries(value.servicePorts).flatMap(([serviceId, port]) =>
          typeof port === "number" ? [[serviceId, port]] : [],
        ),
      )
    : {};

  const workspaceRootPath = normalizeWorkspaceRootPath(value.workspaceRootPath);

  return [
    {
      id:
        typeof value.id === "string"
          ? value.id
          : getEnabledWorkspaceId(workspaceRootPath),
      topologyId: value.topologyId,
      projectId: value.projectId,
      projectName: value.projectName,
      workspaceRootPath,
      workspaceRootLabel: value.workspaceRootLabel,
      createdAt:
        typeof value.createdAt === "number" ? value.createdAt : Date.now(),
      servicePorts,
    },
  ];
};

const readStore = async (storePath: string): Promise<WorkspaceIsolationStore> => {
  if (!existsSync(storePath)) {
    return createEmptyStore();
  }

  try {
    const raw = JSON.parse(await fs.readFile(storePath, "utf-8"));
    if (!isRecord(raw)) {
      return createEmptyStore();
    }

    const topologies = Array.isArray(raw.topologies)
      ? raw.topologies.flatMap(normalizeTopology)
      : [];
    const enabledWorkspaces = Array.isArray(raw.enabledWorkspaces)
      ? raw.enabledWorkspaces.flatMap(normalizeEnabledWorkspace)
      : [];

    return { topologies, enabledWorkspaces };
  } catch (error) {
    console.error(`Failed to read Workspace Isolation store at ${storePath}:`, error);
    return createEmptyStore();
  }
};

const buildProjectTopology = (
  input: SaveWorkspaceIsolationInput,
  createdAt: number,
): WorkspaceIsolationProjectTopology =>
  buildStoredStack(
    {
      ...input,
      workspaceRootPath: normalizeWorkspaceRootPath(input.workspaceRootPath),
    },
    getTopologyId(input.projectId),
    input.services.map((service) => ({
      ...service,
      relativePath:
        input.workspaceMode === "single-app"
          ? "."
          : normalizeRelativeServicePath(service.relativePath),
    })),
    createdAt,
  );

export class WorkspaceIsolationManager {
  private readonly rootStateDir: string;
  private stateDir: string;
  private storePath: string;
  private readonly platform: NodeJS.Platform;
  private readonly allocatePort: PortAllocator;
  private readonly routes: WorkspaceIsolationRoute[] = [];
  private readonly server = createWorkspaceIsolationProxy(
    () => this.routes,
    (message) => console.error(message),
  );
  private store: WorkspaceIsolationStore = createEmptyStore();
  private stacks: WorkspaceIsolationStack[] = [];
  private activeUserId: string | null = null;
  private shellHookStatus: WorkspaceIsolationShellHookStatus;

  constructor(
    userDataPath: string,
    platform: NodeJS.Platform,
    allocatePort: PortAllocator = getNextAvailableServicePort,
  ) {
    this.rootStateDir = path.join(userDataPath, "workspace-isolation");
    this.stateDir = this.rootStateDir;
    this.storePath = path.join(this.stateDir, STORE_FILE_NAME);
    this.platform = platform;
    this.allocatePort = allocatePort;
    this.shellHookStatus = {
      enabled: false,
      supported: this.platform !== "win32",
      installed: false,
      hookPath: null,
      zshrcPath: null,
    };
  }

  private getScopedStateDir(userId: string): string {
    return path.join(
      this.rootStateDir,
      USER_STORES_DIR_NAME,
      toUserStorageSegment(userId),
    );
  }

  private useStateDir(stateDir: string): void {
    this.stateDir = stateDir;
    this.storePath = path.join(stateDir, STORE_FILE_NAME);
  }

  private getMigrationClaimPath(): string {
    return path.join(this.rootStateDir, MIGRATION_CLAIM_FILE_NAME);
  }

  private async getMigrationClaimedBy(): Promise<string | null> {
    try {
      return normalizeUserId(
        await fs.readFile(this.getMigrationClaimPath(), "utf-8"),
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        console.warn("Failed to read Workspace Isolation migration claim:", error);
      }
      return null;
    }
  }

  private async writeStoreFile(
    storePath: string,
    store: WorkspaceIsolationStore,
  ): Promise<void> {
    await fs.mkdir(path.dirname(storePath), { recursive: true });
    await fs.writeFile(
      storePath,
      JSON.stringify(cloneStore(store), null, 2),
      "utf-8",
    );
  }

  private async claimLegacyStoreMigration(userId: string): Promise<void> {
    if (await this.getMigrationClaimedBy()) {
      return;
    }

    await fs.mkdir(this.rootStateDir, { recursive: true });
    const legacyStorePath = path.join(this.rootStateDir, STORE_FILE_NAME);
    const scopedStorePath = path.join(
      this.getScopedStateDir(userId),
      STORE_FILE_NAME,
    );

    if (!existsSync(scopedStorePath) && existsSync(legacyStorePath)) {
      await this.writeStoreFile(scopedStorePath, await readStore(legacyStorePath));
    }

    await fs.writeFile(this.getMigrationClaimPath(), userId, "utf-8");
  }

  private async loadCurrentStore(): Promise<void> {
    await fs.mkdir(this.stateDir, { recursive: true });
    this.store = await readStore(this.storePath);
    await this.syncDerivedState();
  }

  private requireActiveUser(): string | null {
    return this.activeUserId;
  }

  private getActiveUserRequiredError(): string {
    return "Project Services storage requires an active signed-in user.";
  }

  private assertActiveUser(): void {
    if (!this.requireActiveUser()) {
      throw new Error(this.getActiveUserRequiredError());
    }
  }

  async setActiveUser(
    userId: string,
    shellHooksEnabled = this.shellHookStatus.enabled,
  ): Promise<void> {
    const normalized = normalizeUserId(userId);
    if (!normalized) {
      throw new Error(this.getActiveUserRequiredError());
    }

    await this.claimLegacyStoreMigration(normalized);
    this.activeUserId = normalized;
    this.useStateDir(this.getScopedStateDir(normalized));
    await this.loadCurrentStore();
    this.shellHookStatus = await syncWorkspaceIsolationShellFiles(
      this.rootStateDir,
      this.stacks,
      shellHooksEnabled,
      this.platform,
    );
  }

  async clearActiveUser(
    shellHooksEnabled = this.shellHookStatus.enabled,
  ): Promise<void> {
    this.activeUserId = null;
    this.useStateDir(this.rootStateDir);
    this.store = createEmptyStore();
    await this.syncDerivedState();
    this.shellHookStatus = await syncWorkspaceIsolationShellFiles(
      this.rootStateDir,
      this.stacks,
      shellHooksEnabled,
      this.platform,
    );
  }

  async start(shellHooksEnabled: boolean): Promise<void> {
    await fs.mkdir(this.rootStateDir, { recursive: true });
    this.activeUserId = null;
    this.store = createEmptyStore();
    await this.syncDerivedState();
    await new Promise<void>((resolve, reject) => {
      this.server.once("error", reject);
      this.server.listen(PROXY_PORT, "127.0.0.1", () => {
        this.server.removeListener("error", reject);
        resolve();
      });
    });
    this.shellHookStatus = await syncWorkspaceIsolationShellFiles(
      this.rootStateDir,
      this.stacks,
      shellHooksEnabled,
      this.platform,
    );
  }

  async stop(): Promise<void> {
    if (!this.server.listening) {
      return;
    }
    await new Promise<void>((resolve) => this.server.close(() => resolve()));
  }

  getStacks(): WorkspaceIsolationStack[] {
    this.assertActiveUser();
    return this.stacks.map(cloneStack);
  }

  getProjectTopologies(): WorkspaceIsolationProjectTopology[] {
    this.assertActiveUser();
    return this.store.topologies.map(cloneStack);
  }

  getShellHookStatus(): WorkspaceIsolationShellHookStatus {
    return { ...this.shellHookStatus };
  }

  getProxyStatus(): WorkspaceIsolationProxyStatus {
    return {
      running: this.server.listening,
      port: PROXY_PORT,
      message: this.server.listening
        ? `Proxy running on localhost:${PROXY_PORT}.`
        : "Proxy unavailable. Restart Galactic to restore routed workspace domains.",
    };
  }

  async setShellHooksEnabled(
    enabled: boolean,
  ): Promise<WorkspaceIsolationShellHookStatus> {
    this.shellHookStatus = await syncWorkspaceIsolationShellFiles(
      this.rootStateDir,
      this.stacks,
      enabled,
      this.platform,
    );
    return this.getShellHookStatus();
  }

  async saveProjectTopology(
    input: SaveWorkspaceIsolationInput,
  ): Promise<WorkspaceIsolationTopologyMutationResult> {
    if (!this.requireActiveUser()) {
      return { success: false, error: this.getActiveUserRequiredError() };
    }

    try {
      const topologyId = getTopologyId(input.projectId);
      const existing = this.store.topologies.find(
        (topology) => topology.id === topologyId,
      );
      const topology = buildProjectTopology(
        input,
        existing?.createdAt ?? Date.now(),
      );
      this.store.topologies = [
        topology,
        ...this.store.topologies.filter(
          (item) => item.projectId !== topology.projectId,
        ),
      ];
      await this.persist();
      return { success: true, topology };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to save Workspace Isolation topology.",
      };
    }
  }

  async deleteProjectTopology(
    topologyId: string,
  ): Promise<WorkspaceIsolationTopologyMutationResult> {
    if (!this.requireActiveUser()) {
      return { success: false, error: this.getActiveUserRequiredError() };
    }

    const nextTopologies = this.store.topologies.filter(
      (topology) => topology.id !== topologyId,
    );
    if (nextTopologies.length === this.store.topologies.length) {
      return { success: true };
    }
    this.store = {
      topologies: nextTopologies,
      enabledWorkspaces: this.store.enabledWorkspaces.filter(
        (workspace) => workspace.topologyId !== topologyId,
      ),
    };
    await this.persist();
    return { success: true };
  }

  async enableWorkspace(
    input: EnableWorkspaceIsolationInput,
  ): Promise<WorkspaceIsolationMutationResult> {
    if (!this.requireActiveUser()) {
      return { success: false, error: this.getActiveUserRequiredError() };
    }

    const topologyId = getTopologyId(input.projectId);
    const topology = this.store.topologies.find(
      (item) => item.id === topologyId,
    );
    if (!topology) {
      return {
        success: false,
        error: "Project services must be configured before enabling them for a workspace.",
      };
    }

    const workspaceRootPath = normalizeWorkspaceRootPath(input.workspaceRootPath);
    const existing = this.store.enabledWorkspaces.find(
      (workspace) => workspace.workspaceRootPath === workspaceRootPath,
    );
    const enabledWorkspace: WorkspaceIsolationEnabledWorkspace = {
      id: existing?.id ?? getEnabledWorkspaceId(workspaceRootPath),
      topologyId,
      projectId: input.projectId,
      projectName: input.projectName,
      workspaceRootPath,
      workspaceRootLabel: input.workspaceRootLabel,
      createdAt: existing?.createdAt ?? Date.now(),
      servicePorts: existing?.servicePorts ?? {},
    };

    this.store.enabledWorkspaces = [
      enabledWorkspace,
      ...this.store.enabledWorkspaces.filter(
        (workspace) => workspace.workspaceRootPath !== workspaceRootPath,
      ),
    ];
    await this.persist();

    return {
      success: true,
      stack:
        this.stacks.find(
          (stack) => stack.workspaceRootPath === workspaceRootPath,
        ) ?? undefined,
    };
  }

  async disableWorkspace(
    workspaceRootPath: string,
  ): Promise<WorkspaceIsolationMutationResult> {
    if (!this.requireActiveUser()) {
      return { success: false, error: this.getActiveUserRequiredError() };
    }

    const normalizedPath = normalizeWorkspaceRootPath(workspaceRootPath);
    const nextEnabledWorkspaces = this.store.enabledWorkspaces.filter(
      (workspace) => workspace.workspaceRootPath !== normalizedPath,
    );
    if (nextEnabledWorkspaces.length === this.store.enabledWorkspaces.length) {
      return { success: true };
    }
    this.store = {
      ...this.store,
      enabledWorkspaces: nextEnabledWorkspaces,
    };
    await this.persist();
    return { success: true };
  }

  async deleteProjectIsolationForProject(projectId: string): Promise<void> {
    if (!this.requireActiveUser()) {
      throw new Error(this.getActiveUserRequiredError());
    }

    const topologyId = getTopologyId(projectId);
    this.store = {
      topologies: this.store.topologies.filter(
        (topology) => topology.id !== topologyId,
      ),
      enabledWorkspaces: this.store.enabledWorkspaces.filter(
        (workspace) => workspace.projectId !== projectId,
      ),
    };
    await this.persist();
  }

  private async syncDerivedState(): Promise<void> {
    const topologies = this.store.topologies.filter((topology) =>
      existsSync(topology.workspaceRootPath),
    );
    const topologyIds = new Set(topologies.map((topology) => topology.id));
    const enabledWorkspaces = this.store.enabledWorkspaces.filter(
      (workspace) =>
        topologyIds.has(workspace.topologyId) &&
        existsSync(workspace.workspaceRootPath),
    );
    const topologiesById = new Map(
      topologies.map((topology) => [topology.id, topology]),
    );
    const usedPorts = new Set<number>();
    const normalizedEnabledWorkspaces: WorkspaceIsolationEnabledWorkspace[] = [];
    for (const workspace of enabledWorkspaces) {
        const topology = topologiesById.get(workspace.topologyId);
        if (!topology) {
          normalizedEnabledWorkspaces.push(workspace);
          continue;
        }

        const servicePorts: Record<string, number> = {};
        for (const service of topology.services) {
          const existingPort = workspace.servicePorts[service.id];
          const port =
            typeof existingPort === "number" &&
            existingPort > 0 &&
            !usedPorts.has(existingPort)
              ? existingPort
              : await this.allocatePort(usedPorts);
          usedPorts.add(port);
          servicePorts[service.id] = port;
        }

        normalizedEnabledWorkspaces.push({ ...workspace, servicePorts });
    }

    const enabledByTopologyId = new Map<string, WorkspaceIsolationEnabledWorkspace[]>();
    normalizedEnabledWorkspaces.forEach((workspace) => {
      const current = enabledByTopologyId.get(workspace.topologyId) ?? [];
      current.push(workspace);
      enabledByTopologyId.set(workspace.topologyId, current);
    });

    this.store = {
      topologies,
      enabledWorkspaces: normalizedEnabledWorkspaces,
    };
    this.stacks = normalizedEnabledWorkspaces.flatMap((workspace) => {
      const topology = topologiesById.get(workspace.topologyId);
      if (!topology) {
        return [];
      }

      const services = topology.services.map((service) => {
        const connections = service.connections.flatMap((connection) => {
          const envKey = connection.envKey.trim();
          if (!envKey || !connection.targetStackId || !connection.targetServiceId) {
            return [];
          }

          const targetStackId =
            connection.targetStackId === topology.id
              ? workspace.id
              : this.resolveExternalTargetStackId(
                  enabledByTopologyId,
                  connection.targetStackId,
                  workspace.workspaceRootLabel,
                ) ?? connection.targetStackId;

          return [{ ...connection, envKey, targetStackId }];
        });

        return {
          ...service,
          relativePath:
            topology.workspaceMode === "single-app"
              ? "."
              : normalizeRelativeServicePath(service.relativePath),
          port: workspace.servicePorts[service.id] ?? 0,
          connections,
        };
      });

      const name = getWorkspaceIsolationName(
        topology.projectName,
        workspace.workspaceRootLabel,
      );

      return [
        {
          id: workspace.id,
          kind: "workspace-isolation" as const,
          name,
          slug: toSlug(name, "stack"),
          projectId: topology.projectId,
          workspaceRootPath: workspace.workspaceRootPath,
          workspaceRootLabel: workspace.workspaceRootLabel,
          projectName: topology.projectName,
          workspaceMode: topology.workspaceMode,
          createdAt: workspace.createdAt,
          services,
        },
      ];
    });
    this.routes.splice(
      0,
      this.routes.length,
      ...this.stacks.flatMap((stack) =>
        stack.services.map((service) => ({
          hostname: buildWorkspaceIsolationHostname(stack, service),
          port: service.port,
        })),
      ),
    );
  }

  private resolveExternalTargetStackId(
    enabledByTopologyId: Map<string, WorkspaceIsolationEnabledWorkspace[]>,
    topologyId: string,
    workspaceRootLabel: string,
  ): string | null {
    const candidates = enabledByTopologyId.get(topologyId) ?? [];
    return (
      candidates.find(
        (workspace) => workspace.workspaceRootLabel === workspaceRootLabel,
      )?.id ??
      candidates.find(
        (workspace) => workspace.workspaceRootLabel === REPOSITORY_ROOT_LABEL,
      )?.id ??
      null
    );
  }

  private async persist(): Promise<void> {
    await fs.mkdir(this.stateDir, { recursive: true });
    await this.syncDerivedState();
    await this.writeStoreFile(this.storePath, this.store);
    this.shellHookStatus = await syncWorkspaceIsolationShellFiles(
      this.rootStateDir,
      this.stacks,
      this.shellHookStatus.enabled,
      this.platform,
    );
  }
}
