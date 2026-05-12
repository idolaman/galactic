import { useLocation } from "react-router-dom";
import { WorkspaceConsoleRestoreBar } from "@/components/WorkspaceConsole/WorkspaceConsoleRestoreBar";
import { useWorkspaceConsole } from "@/components/WorkspaceConsole/WorkspaceConsoleContext";
import { WorkspaceConsoleDock } from "@/components/WorkspaceConsole/WorkspaceConsoleDock";
import { shouldShowWorkspaceConsoleRestoreBar } from "@/lib/workspace-console";

export const WorkspaceConsoleRouteDock = () => {
  const location = useLocation();
  const consoleState = useWorkspaceConsole();
  const routeVisible = location.pathname === "/";
  const showRestoreBar = shouldShowWorkspaceConsoleRestoreBar({
    isOpen: consoleState.isOpen,
    routeVisible,
    sessionCount: consoleState.sessions.length,
  });

  return (
    <>
      <WorkspaceConsoleDock routeVisible={routeVisible} />
      {showRestoreBar ? <WorkspaceConsoleRestoreBar /> : null}
    </>
  );
};
