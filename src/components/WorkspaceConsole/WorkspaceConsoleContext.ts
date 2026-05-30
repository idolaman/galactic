import { createContext, useContext } from "react";
import type { WorkspaceConsoleSession } from "@/types/workspace-console";

export interface OpenWorkspaceConsoleInput {
  projectName?: string;
  targetKind?: "base" | "workspace";
  workspaceLabel: string;
  workspacePath: string;
}

export interface WorkspaceConsoleContextValue {
  activeSession: WorkspaceConsoleSession | null;
  canCreateShell: boolean;
  closeSession: (sessionId: string) => Promise<void>;
  collapseConsole: () => void;
  createShell: () => Promise<void>;
  expandConsole: () => void;
  focusSession: (sessionId: string) => void;
  hideDock: () => void;
  isExpanded: boolean;
  isOpen: boolean;
  openConsoleForWorkspace: (input: OpenWorkspaceConsoleInput) => Promise<void>;
  showDock: () => void;
  sessions: WorkspaceConsoleSession[];
}

export const WorkspaceConsoleContext =
  createContext<WorkspaceConsoleContextValue | null>(null);

export const useWorkspaceConsole = (): WorkspaceConsoleContextValue => {
  const value = useContext(WorkspaceConsoleContext);
  if (!value) {
    throw new Error("useWorkspaceConsole must be used inside WorkspaceConsoleProvider.");
  }
  return value;
};
