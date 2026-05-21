import { useState } from "react";
import { WorkspaceConsoleCloseDialog } from "@/components/WorkspaceConsole/WorkspaceConsoleCloseDialog";
import { useWorkspaceConsole } from "@/components/WorkspaceConsole/WorkspaceConsoleContext";
import { WorkspaceConsoleDockHeader } from "@/components/WorkspaceConsole/WorkspaceConsoleDockHeader";
import { WorkspaceConsoleTabRow } from "@/components/WorkspaceConsole/WorkspaceConsoleTabRow";
import { WorkspaceConsoleTerminalView } from "@/components/WorkspaceConsole/WorkspaceConsoleTerminalView";
import {
  shouldConfirmWorkspaceConsoleClose,
  type WorkspaceConsolePresentation,
} from "@/lib/workspace-console";
import { cn } from "@/lib/utils";
import type { WorkspaceConsoleSession } from "@/types/workspace-console";

type WorkspaceConsoleDockPresentation = Extract<
  WorkspaceConsolePresentation,
  "dock" | "expanded"
>;

interface WorkspaceConsoleDockProps {
  presentation: WorkspaceConsoleDockPresentation;
}

export const WorkspaceConsoleDock = ({ presentation }: WorkspaceConsoleDockProps) => {
  const consoleState = useWorkspaceConsole();
  const [pendingCloseSession, setPendingCloseSession] =
    useState<WorkspaceConsoleSession | null>(null);
  const expanded = presentation === "expanded";

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
        "flex flex-col overflow-hidden border-t border-border bg-background shadow-2xl",
        expanded
          ? "min-h-0 flex-1"
          : "h-80 min-h-48 max-h-[60svh] shrink-0",
      )}
    >
      <WorkspaceConsoleDockHeader expanded={expanded} />

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
