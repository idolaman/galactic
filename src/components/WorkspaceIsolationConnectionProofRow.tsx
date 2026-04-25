import { AlertCircle, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  getWorkspaceIsolationConnectionProofLabel,
  getWorkspaceIsolationConnectionProofStatusLabel,
} from "@/lib/workspace-isolation-connection-proof-labels";
import {
  type WorkspaceIsolationConnectionProof,
} from "@/lib/workspace-isolation-connection-proof";
import { cn } from "@/lib/utils";
import type { WorkspaceIsolationStack } from "@/types/workspace-isolation";

interface WorkspaceIsolationConnectionProofRowProps {
  connection: WorkspaceIsolationConnectionProof;
  stack: WorkspaceIsolationStack;
}

const badgeClassNames = {
  live_target: "border-primary/30 bg-primary/10 text-primary",
  configured_target: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  missing_target: "border-destructive/30 bg-destructive/10 text-destructive",
} as const;

export const WorkspaceIsolationConnectionProofRow = ({
  connection,
  stack,
}: WorkspaceIsolationConnectionProofRowProps) => (
  <div className="group/conn flex items-center gap-2 overflow-hidden py-0.5">
    <div className="flex max-w-[40%] shrink-0 items-center gap-2 rounded-md bg-black/[0.02] px-2 py-1.5 transition-colors group-hover/conn:bg-black/5 dark:bg-white/[0.02] dark:group-hover/conn:bg-white/5">
      <span className="truncate font-mono text-[10px] text-muted-foreground transition-colors group-hover/conn:text-foreground">
        {connection.envKey}
      </span>
    </div>

    <div className="flex shrink-0 items-center justify-center text-muted-foreground/40 transition-colors group-hover/conn:text-primary">
      <ArrowRight className="h-3.5 w-3.5" />
    </div>

    <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md bg-black/[0.02] px-2 py-1.5 transition-colors group-hover/conn:bg-black/5 dark:bg-white/[0.02] dark:group-hover/conn:bg-white/5">
      {connection.status === "missing_target" ? (
        <AlertCircle className="h-3 w-3 shrink-0 text-destructive" />
      ) : null}
      <span
        className={cn(
          "shrink-0 text-[10px] font-medium transition-colors",
          connection.status === "missing_target"
            ? "text-destructive"
            : "text-foreground/90 group-hover/conn:text-foreground",
        )}
      >
        {getWorkspaceIsolationConnectionProofLabel(stack, connection)}
      </span>
      <Badge
        variant="outline"
        className={cn("h-5 shrink-0 px-1.5 text-[9px]", badgeClassNames[connection.status])}
      >
        {getWorkspaceIsolationConnectionProofStatusLabel(connection.status)}
      </Badge>
      <span
        className={cn(
          "truncate font-mono text-[10px] transition-colors",
          connection.status === "missing_target"
            ? "text-destructive/80"
            : "text-muted-foreground/60 group-hover/conn:text-muted-foreground",
        )}
      >
        {connection.targetUrl ?? "No live route yet"}
      </span>
    </div>
  </div>
);
