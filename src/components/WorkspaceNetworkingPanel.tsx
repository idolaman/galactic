import { useEffect, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkspaceIsolationAutoEnvWarning } from "@/components/WorkspaceIsolationAutoEnvWarning";
import { WorkspaceIsolationDialog } from "@/components/WorkspaceIsolationDialog";
import { WorkspaceLegacyEnvironmentCard } from "@/components/WorkspaceLegacyEnvironmentCard";
import { WorkspaceIsolationServices } from "@/components/WorkspaceIsolationServices";
import { useWorkspaceIsolationManager } from "@/hooks/use-workspace-isolation-manager";
import { getWorkspaceIsolationServicesOpenState } from "@/lib/workspace-networking-panel";
import { cn } from "@/lib/utils";
import {
  trackWorkspaceIsolationAutoEnvEnableAttempted,
  trackWorkspaceIsolationAutoEnvEnableCompleted,
} from "@/services/workspace-isolation-analytics";
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
  const { workspaceIsolationForWorkspace, shellHookStatus, setShellHooksEnabled } = useWorkspaceIsolationManager();
  const [isWorkspaceIsolationDialogOpen, setIsWorkspaceIsolationDialogOpen] =
    useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isEnablingLocalEnv, setIsEnablingLocalEnv] = useState(false);

  const handleEnableTerminalIntegration = async () => {
    trackWorkspaceIsolationAutoEnvEnableAttempted("workspace-warning");
    setIsEnablingLocalEnv(true);
    const result = await setShellHooksEnabled(true);
    trackWorkspaceIsolationAutoEnvEnableCompleted(
      "workspace-warning",
      result.success,
    );
    setIsEnablingLocalEnv(false);
  };

  const stack = workspaceIsolationForWorkspace(workspacePath);
  const previousStackIdRef = useRef<string | null>(stack?.id ?? null);

  useEffect(() => {
    const nextStackId = stack?.id ?? null;
    setIsServicesOpen((currentOpen) =>
      getWorkspaceIsolationServicesOpenState(
        previousStackIdRef.current,
        nextStackId,
        currentOpen,
      ),
    );
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
              </div>
              <p className="text-xs text-muted-foreground">
                {stack
                  ? "Services in this workspace run on isolated domains to prevent port collisions."
                  : "Run multiple branches simultaneously without port collisions using secure local domains."}
              </p>
            </div>
            <Button
              size="sm"
              variant={stack ? "outline" : "secondary"}
              onClick={() => setIsWorkspaceIsolationDialogOpen(true)}
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

        {stack && shellHookStatus && !shellHookStatus.enabled && shellHookStatus.supported ? (
          <WorkspaceIsolationAutoEnvWarning
            disabled={isEnablingLocalEnv}
            onEnable={handleEnableTerminalIntegration}
          />
        ) : null}

        <WorkspaceLegacyEnvironmentCard
          environments={environments}
          localEnvironmentId={localEnvironmentId}
          workspaceLabel={workspaceLabel}
          onLocalEnvironmentChange={onLocalEnvironmentChange}
        />
      </div>

      <WorkspaceIsolationDialog
        open={isWorkspaceIsolationDialogOpen}
        onOpenChange={setIsWorkspaceIsolationDialogOpen}
        projectId={projectId}
        workspaceRootPath={workspacePath}
        workspaceRootLabel={workspaceLabel}
        projectName={projectName}
        stack={stack}
      />
    </div>
  );
};
