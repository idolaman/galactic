import { getNextAvailableServicePort } from "./workspace-isolation-helpers.js";
import type {
  WorkspaceIsolationConnection,
  WorkspaceIsolationService,
  WorkspaceIsolationStack,
} from "../types/workspace-isolation.js";

export const createWorkspaceIsolationId = () =>
  crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

export const createEmptyConnection = (): WorkspaceIsolationConnection => ({
  id: createWorkspaceIsolationId(),
  envKey: "",
  targetStackId: "",
  targetServiceId: "",
});

export const createEmptyService = (
  existingServices: WorkspaceIsolationService[],
  allStacks: WorkspaceIsolationStack[],
): WorkspaceIsolationService => ({
  id: createWorkspaceIsolationId(),
  name: "",
  slug: "service",
  relativePath: "",
  port: getNextAvailableServicePort(
    allStacks,
    existingServices.map((service) => service.port),
  ),
  createdAt: Date.now(),
  connections: [],
});
