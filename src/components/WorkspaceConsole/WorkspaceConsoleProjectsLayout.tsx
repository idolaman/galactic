import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useWorkspaceConsole } from "@/components/WorkspaceConsole/WorkspaceConsoleContext";
import { WorkspaceConsoleRouteDock } from "@/components/WorkspaceConsole/WorkspaceConsoleRouteDock";
import { getWorkspaceConsolePresentation } from "@/lib/workspace-console";
import { cn } from "@/lib/utils";

interface WorkspaceConsoleProjectsLayoutProps {
  children: ReactNode;
}

export const WorkspaceConsoleProjectsLayout = ({
  children,
}: WorkspaceConsoleProjectsLayoutProps) => {
  const location = useLocation();
  const consoleState = useWorkspaceConsole();
  const presentation = getWorkspaceConsolePresentation({
    isExpanded: consoleState.isExpanded,
    isOpen: consoleState.isOpen,
    routeVisible: location.pathname === "/",
    sessionCount: consoleState.sessions.length,
  });
  const consoleExpanded = presentation === "expanded";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overflow-x-hidden",
          consoleExpanded && "hidden",
        )}
      >
        {children}
      </div>
      <WorkspaceConsoleRouteDock presentation={presentation} />
    </div>
  );
};
