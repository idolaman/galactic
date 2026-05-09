import type {
  WorkspaceIsolationMode,
  WorkspaceIsolationService,
} from "../types/workspace-isolation.js";

export interface ProjectConfigProject {
  id: string;
  name: string;
  path: string;
}

export interface ProjectConfigServices {
  sourceTopologyId: string;
  workspaceMode: WorkspaceIsolationMode;
  services: WorkspaceIsolationService[];
}

export interface ProjectConfigSaveServicesAction {
  type: "save";
  input: {
    name: string;
    projectId: string;
    workspaceRootPath: string;
    workspaceRootLabel: string;
    projectName: string;
    workspaceMode: WorkspaceIsolationMode;
    services: WorkspaceIsolationService[];
  };
}

export interface ProjectConfigRemoveServicesAction {
  type: "remove";
}

export interface ProjectConfigImportAction {
  syncTargets: import("../types/sync-target.js").SyncTarget[];
  projectServices: ProjectConfigSaveServicesAction | ProjectConfigRemoveServicesAction;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const cloneServices = (services: WorkspaceIsolationService[]) =>
  services.map((service) => ({
    ...service,
    connections: service.connections.map((connection) => ({ ...connection })),
  }));

const isWorkspaceMode = (value: unknown): value is WorkspaceIsolationMode =>
  value === "single-app" || value === "monorepo";

const isServiceConnection = (
  value: unknown,
): value is WorkspaceIsolationService["connections"][number] =>
  isRecord(value) &&
  typeof value.id === "string" &&
  typeof value.envKey === "string" &&
  typeof value.targetStackId === "string" &&
  typeof value.targetServiceId === "string";

const isService = (value: unknown): value is WorkspaceIsolationService =>
  isRecord(value) &&
  typeof value.id === "string" &&
  typeof value.name === "string" &&
  typeof value.slug === "string" &&
  typeof value.relativePath === "string" &&
  typeof value.port === "number" &&
  Number.isFinite(value.port) &&
  typeof value.createdAt === "number" &&
  Number.isFinite(value.createdAt) &&
  Array.isArray(value.connections) &&
  value.connections.every(isServiceConnection);

export const parseProjectServices = (
  value: unknown,
): ProjectConfigServices | null => {
  if (value === null) {
    return null;
  }
  if (
    !isRecord(value) ||
    typeof value.sourceTopologyId !== "string" ||
    !isWorkspaceMode(value.workspaceMode) ||
    !Array.isArray(value.services) ||
    !value.services.every(isService)
  ) {
    throw new Error("Project Services metadata is malformed.");
  }
  return {
    sourceTopologyId: value.sourceTopologyId,
    workspaceMode: value.workspaceMode,
    services: cloneServices(value.services),
  };
};

export const rekeySelfReferencingServices = ({
  services,
  sourceTopologyId,
  currentTopologyId,
}: {
  services: WorkspaceIsolationService[];
  sourceTopologyId: string;
  currentTopologyId: string;
}): WorkspaceIsolationService[] =>
  services.map((service) => ({
    ...service,
    connections: service.connections.map((connection) => ({
      ...connection,
      targetStackId:
        connection.targetStackId === sourceTopologyId
          ? currentTopologyId
          : connection.targetStackId,
    })),
  }));
