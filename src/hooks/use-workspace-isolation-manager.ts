import { useContext } from "react";
import {
  WorkspaceIsolationManagerContext,
  type WorkspaceIsolationManagerValue,
} from "@/hooks/workspace-isolation-manager-context";

export const useWorkspaceIsolationManager = (): WorkspaceIsolationManagerValue => {
  const context = useContext(WorkspaceIsolationManagerContext);
  if (!context) {
    throw new Error(
      "useWorkspaceIsolationManager must be used within WorkspaceIsolationManagerProvider",
    );
  }

  return context;
};
