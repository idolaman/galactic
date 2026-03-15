import { useState } from "react";
import type { MouseEvent } from "react";
import { AlertCircle, Check, Clock, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionSummary } from "@/services/session-rpc";
import { useSessionStore } from "@/stores/session-store";

interface StatusConfig {
  color: string;
  icon: typeof Check;
  label: string;
}

export interface QuickSidebarSessionItemProps {
  session: SessionSummary;
}

const getStatusConfig = (session: SessionSummary): StatusConfig => {
  const isDone = session.status === "done";
  const isApproval = Boolean(session.approval_pending_since) && !isDone;
  const hasTiming = Boolean(session.started_at && session.estimated_duration);
  const isOverdue =
    !isDone &&
    hasTiming &&
    Date.now() - new Date(session.started_at ?? 0).getTime() >
      (session.estimated_duration ?? 0) * 2000;

  if (isDone) {
    return { label: "Completed", icon: Check, color: "text-emerald-400" };
  }

  if (isApproval) {
    return { label: "Needs Action", icon: AlertCircle, color: "text-amber-400" };
  }

  if (isOverdue) {
    return { label: "Slow", icon: Clock, color: "text-orange-400" };
  }

  return { label: "Running", icon: Loader2, color: "text-blue-400" };
};

export function QuickSidebarSessionItem({ session }: QuickSidebarSessionItemProps) {
  const ackSession = useSessionStore((state) => state.ackSession);
  const { color, icon: StatusIcon, label } = getStatusConfig(session);
  const isDone = session.status === "done";
  const isRunning = label === "Running";
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsExiting(true);
    setTimeout(() => {
      ackSession(session.id, isDone ? "done" : "run");
    }, 300);
  };

  return (
    <div
      className={cn(
        "group/session relative w-full origin-top pl-9 transition-all duration-300 ease-out",
        isExiting
          ? "pointer-events-none max-h-0 -translate-y-2 scale-95 overflow-hidden py-0 opacity-0"
          : "max-h-[100px] opacity-100",
      )}
    >
      <div
        className={cn(
          "absolute bottom-0 left-5 top-[-50%] w-px bg-white/10 transition-opacity group-last/session:bottom-1/2",
          isExiting && "opacity-0",
        )}
      />
      <div
        className={cn(
          "absolute left-5 top-1/2 h-px w-4 bg-white/10 transition-all",
          isExiting && "opacity-0",
        )}
      />
      <div
        className={cn(
          "relative flex h-7 items-center gap-2.5 overflow-hidden rounded-md border border-transparent bg-transparent px-2 pr-2 transition-all duration-200 hover:bg-white/[0.04] group-data-[selected=true]:border-white/5 group-data-[selected=true]:bg-white/[0.06] group-hover/session:border-white/5",
          isExiting && "scale-[0.98] blur-[2px]",
        )}
      >
        <div
          className={cn(
            "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded transition-all",
            color,
            isRunning && "animate-spin",
          )}
          title={label}
        >
          <StatusIcon className="h-3 w-3" />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span
            className={cn(
              "flex-1 truncate text-[11px] font-medium transition-colors",
              isDone ? "text-slate-500" : "text-slate-300 group-hover/session:text-slate-200",
            )}
          >
            {session.title}
          </span>
          {session.started_at && (
            <span className="shrink-0 font-mono text-[9px] text-slate-600 opacity-0 transition-opacity group-data-[selected=true]:opacity-100 group-hover/session:opacity-100">
              {new Date(session.started_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="flex h-4 w-4 -mr-1 items-center justify-center rounded text-slate-500 opacity-0 transition-all duration-200 group-data-[selected=true]:opacity-100 group-hover/session:opacity-100 hover:bg-white/10 hover:text-slate-300"
          title={isDone ? "Clear session" : "Dismiss session"}
        >
          <X className="h-2.5 w-2.5" />
        </button>
      </div>
    </div>
  );
}
