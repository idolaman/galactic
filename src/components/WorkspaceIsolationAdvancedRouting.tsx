import { AlertCircle, ArrowRight, Box, Link2 } from "lucide-react";
import { useWorkspaceIsolationManager } from "@/hooks/use-workspace-isolation-manager";
import { resolveWorkspaceIsolationConnections } from "@/lib/workspace-isolation-connection-resolution";
import {
  getWorkspaceIsolationConnectionLabel,
  getWorkspaceIsolationRouteDomain,
  getWorkspaceIsolationServicePathLabel,
} from "@/lib/workspace-isolation";
import { cn } from "@/lib/utils";
import type { WorkspaceIsolationStack } from "@/types/workspace-isolation";

interface WorkspaceIsolationAdvancedRoutingProps {
  stack: WorkspaceIsolationStack;
}

export const WorkspaceIsolationAdvancedRouting = ({
  stack,
}: WorkspaceIsolationAdvancedRoutingProps) => {
  const { workspaceIsolationStacks } = useWorkspaceIsolationManager();

  return (
    <div className="grid gap-2.5">
      {stack.services.map((service) => {
        const resolvedConnections = resolveWorkspaceIsolationConnections(
          workspaceIsolationStacks,
          service,
        );
      const servicePath = getWorkspaceIsolationServicePathLabel(service);
      const publicDomain = getWorkspaceIsolationRouteDomain(stack, service);
      const localTarget = `localhost:${service.port}`;

      return (
        <div
          key={service.id}
          className="group flex min-w-0 flex-col gap-2 rounded-lg border border-black/[0.04] bg-background/50 px-3 py-2.5 transition-all hover:bg-background hover:shadow-sm dark:border-white/[0.04]"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-[4px] bg-primary/10 text-primary">
                <Box className="h-3 w-3" />
              </div>
              <p className="text-[11px] font-semibold text-foreground/90">
                {service.name}
              </p>
            </div>
            <p className="truncate rounded bg-black/[0.03] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/80 dark:bg-white/[0.03]">
              {servicePath}
            </p>
          </div>
          
          <div className="flex w-full min-w-0 items-center gap-2 overflow-hidden py-0.5">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md bg-black/[0.02] px-2 py-1.5 dark:bg-white/[0.02] transition-colors group-hover:bg-black/5 dark:group-hover:bg-white/5">
              <span className="truncate font-mono text-[10px] text-muted-foreground transition-colors group-hover:text-foreground">
                {publicDomain}
              </span>
            </div>
            
            <div className="flex shrink-0 items-center justify-center text-muted-foreground/40 transition-colors group-hover:text-primary">
              <ArrowRight className="h-3.5 w-3.5" />
            </div>

            <div className="flex shrink-0 items-center gap-2 rounded-md bg-black/[0.02] px-2 py-1.5 dark:bg-white/[0.02] transition-colors group-hover:bg-black/5 dark:group-hover:bg-white/5">
              <span className="font-mono text-[10px] font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                {localTarget}
              </span>
            </div>
          </div>

          {resolvedConnections.length > 0 && (
            <div className="mt-2 flex flex-col gap-2">
              <div className="flex items-center gap-1.5 px-0.5">
                <Link2 className="h-3 w-3 text-muted-foreground/50" />
                <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Connected Dependencies
                </p>
              </div>
              <div className="grid gap-1">
                {resolvedConnections.map((connection) => (
                  <div key={connection.id} className="group/conn flex items-center gap-2 overflow-hidden py-0.5">
                    <div className="flex shrink-0 max-w-[40%] items-center gap-2 rounded-md bg-black/[0.02] px-2 py-1.5 dark:bg-white/[0.02] transition-colors group-hover/conn:bg-black/5 dark:group-hover/conn:bg-white/5">
                      <span className="truncate font-mono text-[10px] text-muted-foreground transition-colors group-hover/conn:text-foreground">
                        {connection.envKey}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center justify-center text-muted-foreground/40 transition-colors group-hover/conn:text-primary">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>

                    <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md bg-black/[0.02] px-2 py-1.5 dark:bg-white/[0.02] transition-colors group-hover/conn:bg-black/5 dark:group-hover/conn:bg-white/5">
                       {connection.isMissing && (
                         <AlertCircle className="h-3 w-3 shrink-0 text-destructive" />
                       )}
                       <span
                         className={cn(
                           "shrink-0 text-[10px] font-medium transition-colors",
                           connection.isMissing
                             ? "text-destructive"
                             : "text-foreground/90 group-hover/conn:text-foreground",
                         )}
                       >
                         {getWorkspaceIsolationConnectionLabel(stack, connection)}
                       </span>
                       <span
                         className={cn(
                           "truncate font-mono text-[10px] transition-colors",
                           connection.isMissing
                             ? "text-destructive/80"
                             : "text-muted-foreground/60 group-hover/conn:text-muted-foreground",
                         )}
                       >
                         {connection.targetUrl ?? "Missing target"}
                       </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
      })}
    </div>
  );
};
