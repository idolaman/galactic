import { SquareTerminal } from "lucide-react";
import { useWorkspaceConsole } from "@/components/WorkspaceConsole/WorkspaceConsoleContext";
import { WorkspaceConsoleTabRow } from "@/components/WorkspaceConsole/WorkspaceConsoleTabRow";
import { WorkspaceConsoleTerminalView } from "@/components/WorkspaceConsole/WorkspaceConsoleTerminalView";
import type { WorkspaceConsolePresentation } from "@/lib/workspace-console";
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
  const expanded = presentation === "expanded";
  const handleToggleSize = expanded
    ? consoleState.collapseConsole
    : consoleState.expandConsole;

  const handleCloseSession = (session: WorkspaceConsoleSession) => {
    void consoleState.closeSession(session.sessionId);
  };

  return (
    <section
      className={cn(
        "flex flex-col overflow-hidden border-t border-border bg-card",
        expanded
          ? "min-h-0 flex-1"
          : "h-96 min-h-64 max-h-[60svh] shrink-0",
      )}
    >
      <WorkspaceConsoleTabRow
        activeSessionId={consoleState.activeSession?.sessionId ?? null}
        expanded={expanded}
        onCloseSession={handleCloseSession}
        onFocusSession={consoleState.focusSession}
        onHide={consoleState.hideDock}
        onToggleSize={handleToggleSize}
        sessions={consoleState.sessions}
      />

      <div className="min-h-0 flex-1 overflow-hidden bg-zinc-950">
        {consoleState.sessions.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-zinc-400">
            <SquareTerminal className="h-5 w-5 text-zinc-500" />
            <span>No terminal sessions</span>
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
    </section>
  );
};
