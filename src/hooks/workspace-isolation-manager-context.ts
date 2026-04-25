import { createContext } from "react";
import type {
  WorkspaceIsolationMode,
  WorkspaceIsolationProjectTopology,
  WorkspaceIsolationService,
  WorkspaceIsolationStack,
} from "@/types/workspace-isolation";

import type { WorkspaceIsolationShellHookStatus } from "@/types/electron";

export interface SaveWorkspaceIsolationInput {
  name: string;
  projectId: string;
  workspaceRootPath: string;
  workspaceRootLabel: string;
  projectName: string;
  workspaceMode: WorkspaceIsolationMode;
  services: WorkspaceIsolationService[];
}

export interface WorkspaceIsolationManagerValue {
  workspaceIsolationStacks: WorkspaceIsolationStack[];
  workspaceIsolationProjectTopologies: WorkspaceIsolationProjectTopology[];
  workspaceIsolationIntroSeen: boolean;
  shellHookStatus: WorkspaceIsolationShellHookStatus | null;
  workspaceIsolationTopologyForProject: (
    projectId: string,
  ) => WorkspaceIsolationProjectTopology | null;
  workspaceIsolationForWorkspace: (
    workspaceRootPath: string,
  ) => WorkspaceIsolationStack | null;
  saveWorkspaceIsolationProjectTopology: (
    input: SaveWorkspaceIsolationInput,
  ) => Promise<{ success: boolean; error?: string; topology?: WorkspaceIsolationProjectTopology }>;
  deleteWorkspaceIsolationProjectTopology: (
    topologyId: string,
  ) => Promise<{ success: boolean; error?: string }>;
  enableWorkspaceIsolationForWorkspace: (input: {
    projectId: string;
    projectName: string;
    workspaceRootPath: string;
    workspaceRootLabel: string;
  }) => Promise<{ success: boolean; error?: string; stack?: WorkspaceIsolationStack }>;
  disableWorkspaceIsolationForWorkspace: (
    workspaceRootPath: string,
  ) => Promise<{ success: boolean; error?: string }>;
  deleteWorkspaceIsolationForProject: (projectId: string) => Promise<void>;
  markWorkspaceIsolationIntroSeen: () => Promise<{ success: boolean; seen: boolean; error?: string }>;
  setShellHooksEnabled: (enabled: boolean) => Promise<{ success: boolean; enabled: boolean; error?: string }>;
}

export const WorkspaceIsolationManagerContext =
  createContext<WorkspaceIsolationManagerValue | null>(null);
