import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarMenuSubItem } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { SessionSummary } from "@/services/session-rpc";
import { useSessionStore } from "@/stores/session-store";

export interface SidebarSessionItemProps {
  session: SessionSummary;
}

export function SidebarSessionItem({ session }: SidebarSessionItemProps) {
  const ackSession = useSessionStore((state) => state.ackSession);
  const [isOverdue, setIsOverdue] = useState(false);
  const isDone = session.status === "done";
  const isApproval = !isDone && Boolean(session.approval_pending_since);

  useEffect(() => {
    if (isDone || !session.started_at || !session.estimated_duration) {
      setIsOverdue(false);
      return;
    }

    const checkOverdue = () => {
      const start = new Date(session.started_at ?? 0).getTime();
      const elapsedSeconds = (Date.now() - start) / 1000;
      setIsOverdue(elapsedSeconds > session.estimated_duration! * 2);
    };

    checkOverdue();
    const interval = setInterval(checkOverdue, 1000);

    return () => clearInterval(interval);
  }, [isDone, session.estimated_duration, session.started_at]);

  const handleDismiss = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    ackSession(session.id, isDone ? "done" : "run");
  };

  return (
    <SidebarMenuSubItem>
      <div className="group/session relative flex w-full items-start gap-2.5 rounded-md py-1.5 pl-9 pr-6 transition-colors select-none hover:bg-sidebar-accent/50">
        <div
          className={cn(
            "relative mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border shadow-sm transition-all",
            isDone
              ? "border-emerald-500/20 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : isOverdue
                ? "border-orange-500/20 bg-orange-500/15 text-orange-600 dark:text-orange-400"
                : isApproval
                  ? "border-amber-500/20 bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  : "border-blue-500/20 bg-blue-500/15 text-blue-600 dark:text-blue-400",
          )}
        >
          {isDone ? (
            <Check className="h-3.5 w-3.5" />
          ) : isApproval ? (
            <>
              <div className="h-1.5 w-1.5 rounded-full bg-current animate-ping" />
              <div className="absolute h-1.5 w-1.5 rounded-full bg-current" />
            </>
          ) : (
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <span className="break-words whitespace-normal text-xs font-medium leading-snug text-foreground/90">
            {session.title || "Thinking..."}
          </span>
          <span
            className={cn(
              "mt-0.5 text-[10px] font-normal",
              isOverdue && !isDone ? "text-orange-500/90" : "text-muted-foreground/80",
            )}
          >
            {isDone
              ? "Finished"
              : isApproval
                ? "Action Needed"
                : isOverdue
                  ? "Taking longer than expected..."
                  : "Thinking..."}
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1.5 h-6 w-6 rounded-md opacity-0 transition-all group-hover/session:opacity-100 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={handleDismiss}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </SidebarMenuSubItem>
  );
}
