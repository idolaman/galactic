import { createEmptyService } from "./workspace-isolation-dialog.js";
import type {
  WorkspaceIsolationMode,
  WorkspaceIsolationService,
  WorkspaceIsolationStack,
} from "../types/workspace-isolation.js";

export const getWorkspaceIsolationMode = (
  stack?: Pick<WorkspaceIsolationStack, "workspaceMode"> | null,
): WorkspaceIsolationMode => stack?.workspaceMode ?? "monorepo";

export const createSingleAppDraftServices = (
  services: WorkspaceIsolationService[],
  allStacks: WorkspaceIsolationStack[],
): WorkspaceIsolationService[] => {
  const nextService = services[0] ?? createEmptyService([], allStacks);
  return [{ ...nextService, relativePath: "." }];
};

export const createMonorepoDraftServices = (
  services: WorkspaceIsolationService[],
  allStacks: WorkspaceIsolationStack[],
): WorkspaceIsolationService[] =>
  services.length > 0 ? services : [createEmptyService([], allStacks)];
