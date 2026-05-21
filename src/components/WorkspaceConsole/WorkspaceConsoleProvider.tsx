import type { ReactNode } from "react";
import { useWorkspaceConsoleController } from "@/hooks/use-workspace-console-controller";
import {
  WorkspaceConsoleContext,
} from "@/components/WorkspaceConsole/WorkspaceConsoleContext";

interface WorkspaceConsoleProviderProps {
  children: ReactNode;
}

export const WorkspaceConsoleProvider = ({
  children,
}: WorkspaceConsoleProviderProps) => {
  const value = useWorkspaceConsoleController();

  return (
    <WorkspaceConsoleContext.Provider value={value}>
      {children}
    </WorkspaceConsoleContext.Provider>
  );
};
