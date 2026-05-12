import { useState } from "react";
import { EyeOff, Plus, SquareTerminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WorkspaceConsoleCloseDialog } from "@/components/WorkspaceConsole/WorkspaceConsoleCloseDialog";
import { useWorkspaceConsole } from "@/components/WorkspaceConsole/WorkspaceConsoleContext";
import { WorkspaceConsoleTabRow } from "@/components/WorkspaceConsole/WorkspaceConsoleTabRow";
import { WorkspaceConsoleTerminalView } from "@/components/WorkspaceConsole/WorkspaceConsoleTerminalView";
import {
  shouldConfirmWorkspaceConsoleClose,
  shouldShowWorkspaceConsoleDock,
} from "@/lib/workspace-console";
import { cn } from "@/lib/utils";
import type { WorkspaceConsoleSession } from "@/types/workspace-console";

interface WorkspaceConsoleDockProps {
  routeVisible?: boolean;
}

export const WorkspaceConsoleDock = ({
  routeVisible = true,
}: WorkspaceConsoleDockProps) => {
  const consoleState = useWorkspaceConsole();
  const [pendingCloseSession, setPendingCloseSession] =
    useState<WorkspaceConsoleSession | null>(null);
  const showDock = shouldShowWorkspaceConsoleDock({
    isOpen: consoleState.isOpen,
    routeVisible,
    sessionCount: consoleState.sessions.length,
  });

  const handleCloseSession = (session: WorkspaceConsoleSession) => {
    if (shouldConfirmWorkspaceConsoleClose(session)) {
      setPendingCloseSession(session);
      return;
    }
    void consoleState.closeSession(session.sessionId);
  };

  const handleConfirmClose = () => {
    if (pendingCloseSession) {
      void consoleState.closeSession(pendingCloseSession.sessionId);
    }
    setPendingCloseSession(null);
  };

  return (
    <section
      className={cn(
        "flex h-80 min-h-48 max-h-[60svh] shrink-0 flex-col overflow-hidden border-t border-border bg-background shadow-2xl",
        !showDock && "hidden",
      )}
    >
      <div className="flex min-h-12 items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <SquareTerminal className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <div className="text-sm font-semibold">Workspace Console</div>
            <div className="truncate text-xs text-muted-foreground">
              {consoleState.activeSession?.workspaceLabel ?? "No active workspace"}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={!consoleState.canCreateShell}
            onClick={() => void consoleState.createShell()}
          >
            <Plus className="h-4 w-4" />
            New Shell
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={consoleState.hideDock}>
                <EyeOff className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Hide console</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <WorkspaceConsoleTabRow
        activeSessionId={consoleState.activeSession?.sessionId ?? null}
        onCloseSession={handleCloseSession}
        onFocusSession={consoleState.focusSession}
        sessions={consoleState.sessions}
      />

      <div className="min-h-0 flex-1 overflow-hidden bg-black">
        {consoleState.sessions.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No terminal sessions
          </div>
        ) : (
          consoleState.sessions.map((session) => (
            <WorkspaceConsoleTerminalView
              key={session.sessionId}
              active={consoleState.activeSession?.sessionId === session.sessionId}
              session={session}
            />
          ))
        )}
      </div>

      <WorkspaceConsoleCloseDialog
        session={pendingCloseSession}
        onOpenChange={(open) => {
          if (!open) setPendingCloseSession(null);
        }}
        onConfirm={handleConfirmClose}
      />
    </section>
  );
};
