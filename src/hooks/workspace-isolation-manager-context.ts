import { createContext } from "react";
import type {
  WorkspaceIsolationMode,
  WorkspaceIsolationService,
  WorkspaceIsolationStack,
} from "@/types/workspace-isolation";

import type { WorkspaceIsolationShellHookStatus } from "@/types/electron";

export interface SaveWorkspaceIsolationInput {
  id: string;
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
  workspaceIsolationIntroSeen: boolean;
  shellHookStatus: WorkspaceIsolationShellHookStatus | null;
  workspaceIsolationForWorkspace: (
    workspaceRootPath: string,
  ) => WorkspaceIsolationStack | null;
  saveWorkspaceIsolationStack: (
    input: SaveWorkspaceIsolationInput,
  ) => Promise<{ success: boolean; error?: string; stack?: WorkspaceIsolationStack }>;
  deleteWorkspaceIsolationStack: (
    stackId: string,
  ) => Promise<{ success: boolean; error?: string }>;
  deleteWorkspaceIsolationForWorkspace: (workspaceRootPath: string) => Promise<void>;
  markWorkspaceIsolationIntroSeen: () => Promise<{ success: boolean; seen: boolean; error?: string }>;
  setShellHooksEnabled: (enabled: boolean) => Promise<{ success: boolean; enabled: boolean; error?: string }>;
}

export const WorkspaceIsolationManagerContext =
  createContext<WorkspaceIsolationManagerValue | null>(null);
