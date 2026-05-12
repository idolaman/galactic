import { SquareTerminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWorkspaceConsole } from "@/components/WorkspaceConsole/WorkspaceConsoleContext";

const getSessionCountLabel = (count: number): string =>
  count === 1 ? "1 session" : `${count} sessions`;

export const WorkspaceConsoleRestoreBar = () => {
  const consoleState = useWorkspaceConsole();
  const workspaceLabel = consoleState.activeSession?.workspaceLabel;

  return (
    <div className="flex min-h-12 shrink-0 items-center justify-between gap-3 border-t border-border bg-background/95 px-4 shadow-2xl">
      <div className="flex min-w-0 items-center gap-3">
        <SquareTerminal className="h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Workspace Console</span>
            <Badge variant="outline" className="rounded-md px-2 py-0 text-[10px]">
              {getSessionCountLabel(consoleState.sessions.length)}
            </Badge>
          </div>
          {workspaceLabel ? (
            <div className="truncate text-xs text-muted-foreground">{workspaceLabel}</div>
          ) : null}
        </div>
      </div>

      <Button size="sm" className="shrink-0 gap-2" onClick={consoleState.showDock}>
        <SquareTerminal className="h-4 w-4" />
        Show Console
      </Button>
    </div>
  );
};
