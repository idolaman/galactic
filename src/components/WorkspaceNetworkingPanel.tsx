import { useEffect, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ServiceStackDialog } from "@/components/ServiceStackDialog";
import { WorkspaceLegacyEnvironmentCard } from "@/components/WorkspaceLegacyEnvironmentCard";
import { WorkspaceIsolationServices } from "@/components/WorkspaceIsolationServices";
import { useServiceStackManager } from "@/hooks/use-service-stack-manager";
import { cn } from "@/lib/utils";
import type { Environment } from "@/types/environment";

interface WorkspaceNetworkingPanelProps {
  projectId: string;
  projectName: string;
  workspacePath: string;
  workspaceLabel: string;
  environments: Environment[];
  localEnvironmentId: string | null;
  onLocalEnvironmentChange: (environmentId: string | null) => void;
}

export const WorkspaceNetworkingPanel = ({
  projectId,
  projectName,
  workspacePath,
  workspaceLabel,
  environments,
  localEnvironmentId,
  onLocalEnvironmentChange,
}: WorkspaceNetworkingPanelProps) => {
  const { serviceStackForWorkspace } = useServiceStackManager();
  const [isServiceStackDialogOpen, setIsServiceStackDialogOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);

  const stack = serviceStackForWorkspace(workspacePath);
  const previousStackIdRef = useRef<string | null>(stack?.id ?? null);

  useEffect(() => {
    const nextStackId = stack?.id ?? null;
    if (!previousStackIdRef.current && nextStackId) {
      setIsServicesOpen(true);
    }
    if (previousStackIdRef.current && !nextStackId) {
      setIsServicesOpen(false);
    }
    previousStackIdRef.current = nextStackId;
  }, [stack?.id]);

  return (
    <div className="space-y-3 pt-1">
      <div className="flex flex-col gap-3">
        <div className={cn(
          "overflow-hidden rounded-lg border shadow-sm transition-all duration-200",
          stack ? "border-primary/30 bg-primary/5" : "border-border bg-card"
        )}>
          <div className="flex items-center justify-between gap-4 p-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className={cn("h-4 w-4", stack ? "text-primary" : "text-muted-foreground")} />
                <p className="text-sm font-medium">Workspace Isolation</p>
                {stack ? <Badge variant="secondary" className="h-[22px] bg-primary/20 hover:bg-primary/30 text-primary border-primary/20 text-[10px]">Active</Badge> : null}
              </div>
              <p className="text-xs text-muted-foreground">
                {stack
                  ? "Galactic gives this workspace routed local domains for each service."
                  : "Create routed local domains for services in this workspace."}
              </p>
            </div>
            <Button
              size="sm"
              variant={stack ? "outline" : "secondary"}
              onClick={() => setIsServiceStackDialogOpen(true)}
              className={cn("shrink-0", stack && "border-primary/20 hover:bg-primary/10")}
            >
              {stack ? "Edit Isolation" : "Isolate Workspace"}
            </Button>
          </div>
          
          {stack ? (
            <div className="border-t border-primary/10 bg-background/50">
              <WorkspaceIsolationServices
                stack={stack}
                open={isServicesOpen}
                onOpenChange={setIsServicesOpen}
              />
            </div>
          ) : null}
        </div>

        <WorkspaceLegacyEnvironmentCard
          environments={environments}
          localEnvironmentId={localEnvironmentId}
          workspaceLabel={workspaceLabel}
          onLocalEnvironmentChange={onLocalEnvironmentChange}
        />
      </div>

      <ServiceStackDialog
        open={isServiceStackDialogOpen}
        onOpenChange={setIsServiceStackDialogOpen}
        projectId={projectId}
        workspaceRootPath={workspacePath}
        workspaceRootLabel={workspaceLabel}
        projectName={projectName}
        stack={stack}
      />
    </div>
  );
};
