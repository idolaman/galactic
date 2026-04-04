import {
  createEmptyConnection,
  createEmptyService,
} from "@/lib/service-stack-dialog";
import { sanitizeRelativeServicePathInput } from "@/lib/service-stack-mock";
import { applyDerivedServiceFields } from "@/lib/service-stack-routing";
import type {
  ServiceStackConnection,
  ServiceStackEnvironment,
  ServiceStackService,
} from "@/types/service-stack";

const getDraftServices = (services: ServiceStackService[]) =>
  applyDerivedServiceFields(services);

export const addDraftService = (
  current: ServiceStackService[],
  serviceStacks: ServiceStackEnvironment[],
) => getDraftServices([...current, createEmptyService(current, serviceStacks)]);

export const changeDraftService = (
  current: ServiceStackService[],
  serviceId: string,
  updates: Partial<ServiceStackService>,
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
  current: ServiceStackService[],
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
  current: ServiceStackService[],
  serviceId: string,
) => current.map((service) =>
  service.id === serviceId
    ? { ...service, connections: [...service.connections, createEmptyConnection()] }
    : service,
);

export const changeDraftConnection = (
  current: ServiceStackService[],
  serviceId: string,
  linkId: string,
  updates: Partial<ServiceStackConnection>,
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
  current: ServiceStackService[],
  serviceId: string,
  linkId: string,
) => current.map((service) =>
  service.id === serviceId
    ? { ...service, connections: service.connections.filter((link) => link.id !== linkId) }
    : service,
);
