import { useState, type ReactNode } from "react";
import { normalizeWorkspaceRootPath, toServiceStackSlug } from "@/lib/service-stack-mock";
import { applyDerivedServiceFields } from "@/lib/service-stack-routing";
import { ServiceStackManagerContext, type SaveServiceStackInput, type ServiceStackManagerValue } from "@/hooks/service-stack-manager-context";
import type {
  ServiceStackConnection,
  ServiceStackEnvironment,
  ServiceStackService,
} from "@/types/service-stack";

const normalizeConnections = (
  connections: ServiceStackConnection[],
): ServiceStackConnection[] =>
  connections.flatMap((link) => {
    const envKey = link.envKey.trim();
    if (!envKey || !link.targetStackId || !link.targetServiceId) {
      return [];
    }

    return [{ ...link, envKey }];
  });

const normalizeServices = (
  services: ServiceStackService[],
): ServiceStackService[] => {
  return applyDerivedServiceFields(
    services.map((service) => ({
      ...service,
      connections: normalizeConnections(service.connections),
    })),
  );
};

export const ServiceStackManagerProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [serviceStacks, setServiceStacks] = useState<ServiceStackEnvironment[]>([]);

  const serviceStackForWorkspace = (workspaceRootPath: string) => {
    const normalizedPath = normalizeWorkspaceRootPath(workspaceRootPath);
    return serviceStacks.find((stack) => stack.workspaceRootPath === normalizedPath) ?? null;
  };

  const saveServiceStack = (input: SaveServiceStackInput) => {
    const timestamp = Date.now();
    const normalizedWorkspaceRootPath = normalizeWorkspaceRootPath(input.workspaceRootPath);
    const nextStack: ServiceStackEnvironment = {
      id: input.id,
      kind: "service-stack",
      name: input.name.trim(),
      slug: toServiceStackSlug(input.name, "stack"),
      projectId: input.projectId,
      workspaceRootPath: normalizedWorkspaceRootPath,
      workspaceRootLabel: input.workspaceRootLabel,
      projectName: input.projectName,
      workspaceMode: input.workspaceMode,
      createdAt: serviceStacks.find((stack) => stack.id === input.id)?.createdAt ?? timestamp,
      services: normalizeServices(input.services),
    };

    setServiceStacks((currentStacks) => {
      const nextStacks = currentStacks.filter(
        (stack) =>
          stack.id !== nextStack.id &&
          stack.workspaceRootPath !== normalizedWorkspaceRootPath,
      );
      return [nextStack, ...nextStacks];
    });

    return nextStack;
  };

  const deleteServiceStack = (stackId: string) => {
    setServiceStacks((currentStacks) =>
      currentStacks.filter((stack) => stack.id !== stackId),
    );
  };

  const value: ServiceStackManagerValue = {
    serviceStacks,
    serviceStackForWorkspace,
    saveServiceStack,
    deleteServiceStack,
  };

  return (
    <ServiceStackManagerContext.Provider value={value}>
      {children}
    </ServiceStackManagerContext.Provider>
  );
};
