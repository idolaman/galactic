import { useLocation } from "react-router-dom";
import { WorkspaceConsoleDock } from "@/components/WorkspaceConsole/WorkspaceConsoleDock";

export const WorkspaceConsoleRouteDock = () => {
  const location = useLocation();

  return <WorkspaceConsoleDock routeVisible={location.pathname === "/"} />;
};
