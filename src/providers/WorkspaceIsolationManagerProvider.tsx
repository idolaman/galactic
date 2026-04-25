import type { ReactNode } from "react";
import { useWorkspaceIsolationManagerValue } from "@/hooks/use-workspace-isolation-manager-value";
import { WorkspaceIsolationManagerContext } from "@/hooks/workspace-isolation-manager-context";

interface WorkspaceIsolationManagerProviderProps {
  children: ReactNode;
}

export const WorkspaceIsolationManagerProvider = ({
  children,
}: WorkspaceIsolationManagerProviderProps) => {
  const value = useWorkspaceIsolationManagerValue();

  return (
    <WorkspaceIsolationManagerContext.Provider value={value}>
      {children}
    </WorkspaceIsolationManagerContext.Provider>
  );
};
