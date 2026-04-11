import { createContext } from "react";
import type {
  WorkspaceIsolationMode,
  WorkspaceIsolationService,
  WorkspaceIsolationStack,
} from "@/types/workspace-isolation";

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
}

export const WorkspaceIsolationManagerContext =
  createContext<WorkspaceIsolationManagerValue | null>(null);
