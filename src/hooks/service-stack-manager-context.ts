import { createContext } from "react";
import type {
  ServiceStackEnvironment,
  ServiceStackService,
  ServiceStackWorkspaceMode,
} from "@/types/service-stack";

export interface SaveServiceStackInput {
  id: string;
  name: string;
  projectId: string;
  workspaceRootPath: string;
  workspaceRootLabel: string;
  projectName: string;
  workspaceMode: ServiceStackWorkspaceMode;
  services: ServiceStackService[];
}

export interface ServiceStackManagerValue {
  serviceStacks: ServiceStackEnvironment[];
  serviceStackForWorkspace: (workspaceRootPath: string) => ServiceStackEnvironment | null;
  saveServiceStack: (input: SaveServiceStackInput) => ServiceStackEnvironment;
  deleteServiceStack: (stackId: string) => void;
}

export const ServiceStackManagerContext =
  createContext<ServiceStackManagerValue | null>(null);
