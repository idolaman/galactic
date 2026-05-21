import { WorkspaceConsoleRestoreBar } from "@/components/WorkspaceConsole/WorkspaceConsoleRestoreBar";
import { WorkspaceConsoleDock } from "@/components/WorkspaceConsole/WorkspaceConsoleDock";
import type { WorkspaceConsolePresentation } from "@/lib/workspace-console";

interface WorkspaceConsoleRouteDockProps {
  presentation: WorkspaceConsolePresentation;
}

export const WorkspaceConsoleRouteDock = ({
  presentation,
}: WorkspaceConsoleRouteDockProps) => {
  if (presentation === "restore") return <WorkspaceConsoleRestoreBar />;
  if (presentation === "dock" || presentation === "expanded") {
    return <WorkspaceConsoleDock presentation={presentation} />;
  }
  return null;
};
