import { normalizeSyncTargets } from "../services/sync-targets.js";
import type { SyncTarget } from "../types/sync-target.js";
import type { WorkspaceIsolationProjectTopology } from "../types/workspace-isolation.js";
import {
  cloneServices,
  parseProjectServices,
  rekeySelfReferencingServices,
  type ProjectConfigImportAction,
  type ProjectConfigProject,
  type ProjectConfigServices,
} from "./project-config-services.js";
import { getWorkspaceIsolationTopologyId } from "./workspace-isolation-helpers.js";
import { REPOSITORY_ROOT_LABEL } from "./workspace-isolation-routing.js";

export const PROJECT_CONFIG_KIND = "galactic-project-config";
export const PROJECT_CONFIG_VERSION = 1;

export type {
  ProjectConfigImportAction,
  ProjectConfigProject,
  ProjectConfigServices,
};

export interface ProjectConfigManifest {
  kind: typeof PROJECT_CONFIG_KIND;
  version: typeof PROJECT_CONFIG_VERSION;
  workspaceConfigSync: {
    syncTargets: SyncTarget[];
  };
  projectServices: ProjectConfigServices | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const buildProjectConfigManifest = ({
  syncTargets,
  projectServices,
}: {
  syncTargets: SyncTarget[];
  projectServices: WorkspaceIsolationProjectTopology | null;
}): ProjectConfigManifest => ({
  kind: PROJECT_CONFIG_KIND,
  version: PROJECT_CONFIG_VERSION,
  workspaceConfigSync: {
    syncTargets: normalizeSyncTargets(syncTargets),
  },
  projectServices: projectServices
    ? {
        sourceTopologyId: projectServices.id,
        workspaceMode: projectServices.workspaceMode,
        services: cloneServices(projectServices.services),
      }
    : null,
});

export const parseProjectConfigManifest = (
  value: unknown,
): ProjectConfigManifest => {
  if (!isRecord(value) || value.kind !== PROJECT_CONFIG_KIND) {
    throw new Error("This is not a Galactic project config file.");
  }
  if (value.version !== PROJECT_CONFIG_VERSION) {
    throw new Error("This Galactic project config version is not supported.");
  }
  if (!isRecord(value.workspaceConfigSync)) {
    throw new Error("Workspace Config Sync metadata is missing.");
  }

  const importedTargets = value.workspaceConfigSync.syncTargets;
  if (!Array.isArray(importedTargets)) {
    throw new Error("Workspace Config Sync targets are malformed.");
  }

  return {
    kind: PROJECT_CONFIG_KIND,
    version: PROJECT_CONFIG_VERSION,
    workspaceConfigSync: {
      syncTargets: normalizeSyncTargets(importedTargets),
    },
    projectServices: parseProjectServices(value.projectServices),
  };
};

export const buildProjectConfigImportAction = (
  manifest: ProjectConfigManifest,
  project: ProjectConfigProject,
): ProjectConfigImportAction => {
  if (!manifest.projectServices) {
    return {
      syncTargets: manifest.workspaceConfigSync.syncTargets,
      projectServices: { type: "remove" },
    };
  }

  const currentTopologyId = getWorkspaceIsolationTopologyId(project.id);
  const services = rekeySelfReferencingServices({
    services: manifest.projectServices.services,
    sourceTopologyId: manifest.projectServices.sourceTopologyId,
    currentTopologyId,
  });

  return {
    syncTargets: manifest.workspaceConfigSync.syncTargets,
    projectServices: {
      type: "save",
      input: {
        name: project.name,
        projectId: project.id,
        workspaceRootPath: project.path,
        workspaceRootLabel: REPOSITORY_ROOT_LABEL,
        projectName: project.name,
        workspaceMode: manifest.projectServices.workspaceMode,
        services,
      },
    },
  };
};

export const getProjectConfigDefaultFileName = (projectName: string): string => {
  const slug = projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "project"}-galactic-config.json`;
};
