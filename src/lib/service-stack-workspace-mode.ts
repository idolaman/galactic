import { createEmptyService } from "./service-stack-dialog.js";
import type {
  ServiceStackEnvironment,
  ServiceStackService,
  ServiceStackWorkspaceMode,
} from "../types/service-stack.js";

export const getServiceStackWorkspaceMode = (
  stack?: Pick<ServiceStackEnvironment, "workspaceMode"> | null,
): ServiceStackWorkspaceMode => stack?.workspaceMode ?? "monorepo";

export const createSingleAppDraftServices = (
  services: ServiceStackService[],
  allStacks: ServiceStackEnvironment[],
): ServiceStackService[] => {
  const nextService = services[0] ?? createEmptyService([], allStacks);
  return [{ ...nextService, relativePath: "." }];
};

export const createMonorepoDraftServices = (
  services: ServiceStackService[],
  allStacks: ServiceStackEnvironment[],
): ServiceStackService[] => services.length > 0 ? services : [createEmptyService([], allStacks)];
