import { PanelBottomOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWorkspaceConsole } from "@/components/WorkspaceConsole/WorkspaceConsoleContext";

export const WorkspaceConsoleRestoreBar = () => {
  const consoleState = useWorkspaceConsole();

  return (
    <div className="pointer-events-none flex min-h-12 shrink-0 items-end justify-end px-4 pb-3">
      <div className="pointer-events-auto relative">
        <Button
          variant="outline"
          size="icon"
          aria-label="Show terminals"
          className="h-9 w-9 rounded-md bg-card shadow-sm"
          onClick={consoleState.showDock}
        >
          <PanelBottomOpen className="h-4 w-4" />
          <span className="sr-only">Show terminals</span>
        </Button>
        <div className="pointer-events-none absolute -right-2 -top-2 flex items-center">
          <Badge
            variant="secondary"
            className="h-4 rounded-full px-1 text-[10px] leading-none"
          >
            {consoleState.sessions.length}
          </Badge>
        </div>
      </div>
    </div>
  );
};
