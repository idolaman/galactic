import { applyDerivedWorkspaceIsolationServiceFields } from "./workspace-isolation-routing.js";
import { normalizeRelativeServicePath } from "./workspace-isolation-helpers.js";
import type {
  WorkspaceIsolationMode,
  WorkspaceIsolationService,
} from "../types/workspace-isolation.js";

export interface WorkspaceIsolationDraftError {
  title: string;
  description: string;
}

export const validateWorkspaceIsolationDraft = (
  draftName: string,
  draftStackId: string,
  workspaceMode: WorkspaceIsolationMode,
  draftServices: WorkspaceIsolationService[],
): { name: string; services: WorkspaceIsolationService[] } | { error: WorkspaceIsolationDraftError } => {
  const stackName = draftName.trim();
  if (!stackName) {
    return {
      error: {
        title: "Name required",
        description: "Project Services name cannot be empty.",
      },
    };
  }

  if (draftServices.length === 0) {
    return {
      error: {
        title: "Add a service",
        description: "Project Services needs at least one service.",
      },
    };
  }

  const services = applyDerivedWorkspaceIsolationServiceFields(
    draftServices.map((service) =>
      workspaceMode === "single-app"
        ? { ...service, relativePath: "." }
        : {
            ...service,
            relativePath: normalizeRelativeServicePath(service.relativePath),
          },
    ),
  );
  if (
    workspaceMode === "monorepo" &&
    draftServices.some(
      (service) => normalizeRelativeServicePath(service.relativePath) === ".",
    )
  ) {
    return {
      error: {
        title: "Folder path required",
        description: "Monorepo mode needs a relative folder path like app/api.",
      },
    };
  }

  const seenServicePaths = new Set<string>();
  for (const service of services) {
    if (seenServicePaths.has(service.relativePath)) {
      return {
        error: {
          title: "Duplicate folders",
          description: "Each service needs a unique relative folder path.",
        },
      };
    }

    seenServicePaths.add(service.relativePath);
  }

  for (const service of services) {
    const seenEnvKeys = new Set<string>();
    for (const link of service.connections) {
      const envKey = link.envKey.trim();
      if (!envKey && !link.targetStackId && !link.targetServiceId) continue;
      if (!envKey || !link.targetStackId || !link.targetServiceId) {
        return {
          error: {
            title: "Incomplete connected service",
            description: "Each connected service row needs both an env key and a target.",
          },
        };
      }

      if (
        link.targetStackId === draftStackId &&
        link.targetServiceId === service.id
      ) {
        return {
          error: {
            title: "Invalid connected service",
            description: "A service cannot connect an environment variable to itself.",
          },
        };
      }

      if (seenEnvKeys.has(envKey)) {
        return {
          error: {
            title: "Duplicate env keys",
            description: "Each service can only assign a connected service env key once.",
          },
        };
      }

      seenEnvKeys.add(envKey);
    }
  }

  return {
    name: stackName,
    services: services.map((service) => ({
      ...service,
      connections: service.connections.filter(
        (link) => link.envKey.trim() && link.targetStackId && link.targetServiceId,
      ),
    })),
  };
};
