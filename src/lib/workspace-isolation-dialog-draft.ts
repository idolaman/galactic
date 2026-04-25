import {
  createEmptyConnection,
  createEmptyService,
} from "@/lib/workspace-isolation-dialog";
import { sanitizeRelativeServicePathInput } from "@/lib/workspace-isolation-helpers";
import { applyDerivedWorkspaceIsolationServiceFields } from "@/lib/workspace-isolation-routing";
import type {
  WorkspaceIsolationConnection,
  WorkspaceIsolationService,
  WorkspaceIsolationStack,
} from "@/types/workspace-isolation";

const getDraftServices = (services: WorkspaceIsolationService[]) =>
  applyDerivedWorkspaceIsolationServiceFields(services);

export const addDraftService = (
  current: WorkspaceIsolationService[],
  workspaceIsolationStacks: WorkspaceIsolationStack[],
) => getDraftServices([
  ...current,
  createEmptyService(current, workspaceIsolationStacks),
]);

export const changeDraftService = (
  current: WorkspaceIsolationService[],
  serviceId: string,
  updates: Partial<WorkspaceIsolationService>,
) => getDraftServices(
  current.map((service) => {
    if (service.id !== serviceId) {
      return service;
    }

    return {
      ...service,
      ...updates,
      relativePath: updates.relativePath === undefined
        ? service.relativePath
        : sanitizeRelativeServicePathInput(updates.relativePath),
    };
  }),
);

export const removeDraftService = (
  current: WorkspaceIsolationService[],
  serviceId: string,
  stackId: string,
) => getDraftServices(
  current
    .filter((service) => service.id !== serviceId)
    .map((service) => ({
      ...service,
      connections: service.connections.filter(
        (link) => link.targetServiceId !== serviceId || link.targetStackId !== stackId,
      ),
    })),
);

export const addDraftConnection = (
  current: WorkspaceIsolationService[],
  serviceId: string,
) => current.map((service) =>
  service.id === serviceId
    ? { ...service, connections: [...service.connections, createEmptyConnection()] }
    : service,
);

export const changeDraftConnection = (
  current: WorkspaceIsolationService[],
  serviceId: string,
  linkId: string,
  updates: Partial<WorkspaceIsolationConnection>,
) => current.map((service) =>
  service.id === serviceId
    ? {
        ...service,
        connections: service.connections.map((link) =>
          link.id === linkId ? { ...link, ...updates } : link,
        ),
      }
    : service,
);

export const removeDraftConnection = (
  current: WorkspaceIsolationService[],
  serviceId: string,
  linkId: string,
) => current.map((service) =>
  service.id === serviceId
    ? { ...service, connections: service.connections.filter((link) => link.id !== linkId) }
    : service,
);
