import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { WorkspaceConsoleSession } from "@/types/workspace-console";

interface WorkspaceConsoleTabRowProps {
  activeSessionId: string | null;
  onCloseSession: (session: WorkspaceConsoleSession) => void;
  onFocusSession: (sessionId: string) => void;
  sessions: WorkspaceConsoleSession[];
}

const statusClassNames = {
  error: "bg-destructive",
  exited: "bg-muted-foreground",
  running: "bg-emerald-500",
  starting: "bg-amber-400",
} as const;

export const WorkspaceConsoleTabRow = ({
  activeSessionId,
  onCloseSession,
  onFocusSession,
  sessions,
}: WorkspaceConsoleTabRowProps) => (
  <div className="flex min-h-10 items-center gap-2 overflow-x-auto border-t border-border bg-muted/20 px-3 py-1">
    {sessions.map((session) => (
      <div
        key={session.sessionId}
        className={cn(
          "flex h-8 max-w-64 shrink-0 items-center gap-2 rounded-md border px-2 text-xs",
          activeSessionId === session.sessionId
            ? "border-primary/50 bg-background text-foreground"
            : "border-border/60 bg-background/60 text-muted-foreground",
        )}
      >
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2"
          onClick={() => onFocusSession(session.sessionId)}
        >
          <span
            className={cn(
              "h-2 w-2 shrink-0 rounded-full",
              statusClassNames[session.status],
            )}
          />
          <span className="truncate font-mono">{session.title}</span>
        </button>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => onCloseSession(session)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Close terminal</TooltipContent>
        </Tooltip>
      </div>
    ))}
  </div>
);
