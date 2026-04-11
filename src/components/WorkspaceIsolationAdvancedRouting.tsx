import {
  getWorkspaceIsolationRouteSummary,
  getWorkspaceIsolationServicePathLabel,
} from "@/lib/workspace-isolation";
import type { WorkspaceIsolationStack } from "@/types/workspace-isolation";

interface WorkspaceIsolationAdvancedRoutingProps {
  stack: WorkspaceIsolationStack;
}

export const WorkspaceIsolationAdvancedRouting = ({
  stack,
}: WorkspaceIsolationAdvancedRoutingProps) => (
  <div className="grid gap-2">
    {stack.services.map((service) => {
      const servicePath = getWorkspaceIsolationServicePathLabel(service);

      return (
        <div
          key={service.id}
          className="rounded-md border border-border/40 bg-background/80 px-2.5 py-2"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-medium text-foreground/90">
              {service.name}
            </p>
            <p className="truncate text-[10px] text-muted-foreground">
              {servicePath}
            </p>
          </div>
          <p className="mt-1 break-all font-mono text-[10px] text-muted-foreground">
            {getWorkspaceIsolationRouteSummary(stack, service)}
          </p>
        </div>
      );
    })}
  </div>
);
