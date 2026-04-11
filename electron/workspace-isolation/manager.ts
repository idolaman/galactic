import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { getNextAvailableServicePort } from "./ports.js";
import { createWorkspaceIsolationProxy } from "./proxy.js";
import {
  applyDerivedServiceFields,
  buildStoredStack,
  buildWorkspaceIsolationHostname,
  normalizeRelativeServicePath,
  normalizeWorkspaceRootPath,
} from "./routing.js";
import { syncWorkspaceIsolationShellFiles } from "./shell-hooks.js";
import type {
  SaveWorkspaceIsolationInput,
  WorkspaceIsolationMutationResult,
  WorkspaceIsolationProxyStatus,
  WorkspaceIsolationRoute,
  WorkspaceIsolationShellHookStatus,
  WorkspaceIsolationStack,
} from "./types.js";

const STORE_FILE_NAME = "stacks.json";
const PROXY_PORT = 1355;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

export class WorkspaceIsolationManager {
  private readonly stateDir: string;
  private readonly storePath: string;
  private readonly platform: NodeJS.Platform;
  private readonly routes: WorkspaceIsolationRoute[] = [];
  private readonly server = createWorkspaceIsolationProxy(() => this.routes, (message) => console.error(message));
  private stacks: WorkspaceIsolationStack[] = [];
  private shellHookStatus: WorkspaceIsolationShellHookStatus;

  constructor(userDataPath: string, platform: NodeJS.Platform) {
    this.stateDir = path.join(userDataPath, "workspace-isolation");
    this.storePath = path.join(this.stateDir, STORE_FILE_NAME);
    this.platform = platform;
    this.shellHookStatus = {
      enabled: false,
      supported: this.platform !== "win32",
      installed: false,
      hookPath: null,
      zshrcPath: null,
    };
  }

  async start(shellHooksEnabled: boolean): Promise<void> {
    await fs.mkdir(this.stateDir, { recursive: true });
    this.stacks = await this.loadStacks();
    this.rebuildRoutes();
    await new Promise<void>((resolve, reject) => {
      this.server.once("error", reject);
      this.server.listen(PROXY_PORT, "127.0.0.1", () => {
        this.server.removeListener("error", reject);
        resolve();
      });
    });
    this.shellHookStatus = await syncWorkspaceIsolationShellFiles(this.stateDir, this.stacks, shellHooksEnabled, this.platform);
  }

  async stop(): Promise<void> {
    if (!this.server.listening) {
      return;
    }
    await new Promise<void>((resolve) => this.server.close(() => resolve()));
  }

  getStacks(): WorkspaceIsolationStack[] {
    return this.stacks.map((stack) => ({ ...stack, services: stack.services.map((service) => ({ ...service, connections: [...service.connections] })) }));
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

  async setShellHooksEnabled(enabled: boolean): Promise<WorkspaceIsolationShellHookStatus> {
    this.shellHookStatus = await syncWorkspaceIsolationShellFiles(this.stateDir, this.stacks, enabled, this.platform);
    return this.getShellHookStatus();
  }

  async saveStack(input: SaveWorkspaceIsolationInput): Promise<WorkspaceIsolationMutationResult> {
    try {
      const nextStack = await this.buildNextStack(input);
      this.stacks = [nextStack, ...this.stacks.filter((stack) => stack.id !== nextStack.id && stack.workspaceRootPath !== nextStack.workspaceRootPath)];
      await this.persist();
      return { success: true, stack: nextStack };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to save Workspace Isolation." };
    }
  }

  async deleteStack(stackId: string): Promise<WorkspaceIsolationMutationResult> {
    this.stacks = this.stacks.filter((stack) => stack.id !== stackId);
    await this.persist();
    return { success: true };
  }

  async deleteStackForWorkspace(workspaceRootPath: string): Promise<void> {
    const normalizedPath = normalizeWorkspaceRootPath(workspaceRootPath);
    const nextStacks = this.stacks.filter((stack) => stack.workspaceRootPath !== normalizedPath);
    if (nextStacks.length === this.stacks.length) {
      return;
    }
    this.stacks = nextStacks;
    await this.persist();
  }

  private async loadStacks(): Promise<WorkspaceIsolationStack[]> {
    if (!existsSync(this.storePath)) {
      return [];
    }
    try {
      const raw = JSON.parse(await fs.readFile(this.storePath, "utf-8"));
      if (!Array.isArray(raw)) {
        return [];
      }
      const stacks = raw.flatMap((value) => this.normalizeStoredStack(value));
      const prunedStacks = stacks.filter((stack) => existsSync(stack.workspaceRootPath));
      if (prunedStacks.length !== stacks.length) {
        await fs.writeFile(this.storePath, JSON.stringify(prunedStacks, null, 2), "utf-8");
      }
      return prunedStacks;
    } catch {
      return [];
    }
  }

  private normalizeStoredStack(value: unknown): WorkspaceIsolationStack[] {
    if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string" || typeof value.projectId !== "string" || typeof value.workspaceRootPath !== "string" || typeof value.workspaceRootLabel !== "string" || typeof value.projectName !== "string" || !Array.isArray(value.services)) {
      return [];
    }
    const services = value.services.flatMap((serviceValue) => {
      if (!isRecord(serviceValue) || typeof serviceValue.id !== "string") {
        return [];
      }
      return [{
        id: serviceValue.id,
        name: typeof serviceValue.name === "string" ? serviceValue.name : "",
        slug: typeof serviceValue.slug === "string" ? serviceValue.slug : "",
        relativePath: typeof serviceValue.relativePath === "string" ? normalizeRelativeServicePath(serviceValue.relativePath) : ".",
        port: typeof serviceValue.port === "number" ? serviceValue.port : 0,
        createdAt: typeof serviceValue.createdAt === "number" ? serviceValue.createdAt : Date.now(),
        connections: Array.isArray(serviceValue.connections) ? serviceValue.connections.filter((connection): connection is WorkspaceIsolationStack["services"][number]["connections"][number] => isRecord(connection) && typeof connection.id === "string" && typeof connection.envKey === "string" && typeof connection.targetStackId === "string" && typeof connection.targetServiceId === "string") : [],
      }];
    });
    const input: SaveWorkspaceIsolationInput = {
      id: value.id,
      name: value.name,
      projectId: value.projectId,
      workspaceRootPath: normalizeWorkspaceRootPath(value.workspaceRootPath),
      workspaceRootLabel: value.workspaceRootLabel,
      projectName: value.projectName,
      workspaceMode: value.workspaceMode === "single-app" ? "single-app" : "monorepo",
      services,
    };
    return [buildStoredStack(input, services, typeof value.createdAt === "number" ? value.createdAt : Date.now())];
  }

  private async buildNextStack(input: SaveWorkspaceIsolationInput): Promise<WorkspaceIsolationStack> {
    const normalizedPath = normalizeWorkspaceRootPath(input.workspaceRootPath);
    const existingStack = this.stacks.find((stack) => stack.id === input.id || stack.workspaceRootPath === normalizedPath);
    const usedPorts = new Set<number>(this.stacks.filter((stack) => stack.id !== existingStack?.id).flatMap((stack) => stack.services.map((service) => service.port)));
    const services = await Promise.all(applyDerivedServiceFields(input.services).map(async (service) => {
      const existingService = existingStack?.services.find((item) => item.id === service.id);
      const port = existingService?.port ?? await getNextAvailableServicePort(usedPorts);
      usedPorts.add(port);
      return { ...service, port, relativePath: input.workspaceMode === "single-app" ? "." : normalizeRelativeServicePath(service.relativePath) };
    }));
    return buildStoredStack({ ...input, workspaceRootPath: normalizedPath }, services, existingStack?.createdAt ?? Date.now());
  }

  private rebuildRoutes(): void {
    this.routes.splice(0, this.routes.length, ...this.stacks.flatMap((stack) =>
      stack.services.map((service) => ({ hostname: buildWorkspaceIsolationHostname(stack, service), port: service.port })),
    ));
  }

  private async persist(): Promise<void> {
    this.rebuildRoutes();
    await fs.writeFile(this.storePath, JSON.stringify(this.stacks, null, 2), "utf-8");
    this.shellHookStatus = await syncWorkspaceIsolationShellFiles(this.stateDir, this.stacks, this.shellHookStatus.enabled, this.platform);
  }
}
