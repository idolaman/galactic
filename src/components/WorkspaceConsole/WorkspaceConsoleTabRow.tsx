import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WorkspaceConsoleWindowControls } from "@/components/WorkspaceConsole/WorkspaceConsoleWindowControls";
import { getWorkspaceConsoleTabLabel } from "@/lib/workspace-console";
import { cn } from "@/lib/utils";
import type { WorkspaceConsoleSession } from "@/types/workspace-console";

interface WorkspaceConsoleTabRowProps {
  activeSessionId: string | null;
  expanded: boolean;
  onCloseSession: (session: WorkspaceConsoleSession) => void;
  onFocusSession: (sessionId: string) => void;
  onHide: () => void;
  onToggleSize: () => void;
  sessions: WorkspaceConsoleSession[];
}

export const WorkspaceConsoleTabRow = ({
  activeSessionId,
  expanded,
  onCloseSession,
  onFocusSession,
  onHide,
  onToggleSize,
  sessions,
}: WorkspaceConsoleTabRowProps) => (
  <div className="flex min-h-9 items-end gap-2 bg-muted/20 px-2 pt-1">
    <TooltipProvider delayDuration={250}>
      <div className="workspace-console-tabs flex min-w-0 flex-1 items-end gap-1 overflow-x-auto">
        {sessions.map((session) => {
          const active = activeSessionId === session.sessionId;
          const tabLabel = getWorkspaceConsoleTabLabel(session);

          return (
            <div
              key={session.sessionId}
              className={cn(
                "group flex h-8 w-52 max-w-52 shrink-0 items-center gap-2 rounded-t-md border border-b-0 px-2 text-xs",
                active
                  ? "border-border bg-zinc-950 text-zinc-50"
                  : "border-border/70 bg-background text-muted-foreground",
              )}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Focus terminal ${tabLabel}`}
                    className="min-w-0 flex-1 text-left"
                    onClick={() => onFocusSession(session.sessionId)}
                  >
                    <span className="block max-w-full truncate font-mono font-medium">
                      {tabLabel}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs">
                  {tabLabel}
                </TooltipContent>
              </Tooltip>

              <Button
                variant="ghost"
                size="icon"
                aria-label={`Close terminal ${tabLabel}`}
                className={cn(
                  "pointer-events-none h-6 w-6 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus:pointer-events-auto focus:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100",
                  active &&
                    "pointer-events-auto text-zinc-400 opacity-100 hover:bg-zinc-800 hover:text-zinc-50",
                )}
                onClick={() => onCloseSession(session)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
    <div className="pb-1">
      <WorkspaceConsoleWindowControls
        expanded={expanded}
        onHide={onHide}
        onToggleSize={onToggleSize}
      />
    </div>
  </div>
);
