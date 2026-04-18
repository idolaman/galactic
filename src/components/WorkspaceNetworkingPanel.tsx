import { useEffect, useRef, useState } from "react";
import { PlayCircle, ShieldCheck, StopCircle, Waypoints } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkspaceIsolationAutoEnvWarning } from "@/components/WorkspaceIsolationAutoEnvWarning";
import { WorkspaceIsolationServices } from "@/components/WorkspaceIsolationServices";
import { WorkspaceLegacyEnvironmentCard } from "@/components/WorkspaceLegacyEnvironmentCard";
import { useWorkspaceIsolationManager } from "@/hooks/use-workspace-isolation-manager";
import { getWorkspaceIsolationServicesOpenState } from "@/lib/workspace-networking-panel";
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
  const {
    workspaceIsolationForWorkspace,
    workspaceIsolationTopologyForProject,
    shellHookStatus,
    setShellHooksEnabled,
    enableWorkspaceIsolationForWorkspace,
    disableWorkspaceIsolationForWorkspace,
  } = useWorkspaceIsolationManager();
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isEnablingLocalEnv, setIsEnablingLocalEnv] = useState(false);
  const [isChangingWorkspaceIsolation, setIsChangingWorkspaceIsolation] =
    useState(false);
  const topology = workspaceIsolationTopologyForProject(projectId);
  const realStack = workspaceIsolationForWorkspace(workspacePath);
  const previousStackIdRef = useRef<string | null>(realStack?.id ?? null);

  useEffect(() => {
    const nextStackId = realStack?.id ?? null;
    setIsServicesOpen((currentOpen) =>
      getWorkspaceIsolationServicesOpenState(
        previousStackIdRef.current,
        nextStackId,
        currentOpen,
      ),
    );
    previousStackIdRef.current = nextStackId;
  }, [realStack?.id]);

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

  const handleEnableWorkspaceIsolation = async () => {
    setIsChangingWorkspaceIsolation(true);
    await enableWorkspaceIsolationForWorkspace({
      projectId,
      projectName,
      workspaceRootPath: workspacePath,
      workspaceRootLabel: workspaceLabel,
    });
    setIsChangingWorkspaceIsolation(false);
  };

  const handleDisableWorkspaceIsolation = async () => {
    setIsChangingWorkspaceIsolation(true);
    await disableWorkspaceIsolationForWorkspace(workspacePath);
    setIsChangingWorkspaceIsolation(false);
  };

  return (
    <div className="space-y-4 pt-1">
      <div className="flex flex-col gap-3">
        {topology && !realStack ? (
          <div className="overflow-hidden rounded-lg border border-primary/20 bg-primary/5 shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between p-3 py-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Waypoints className="h-3.5 w-3.5" />
                </div>
                <div className="text-sm font-medium">Project Services ready</div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleEnableWorkspaceIsolation}
                disabled={isChangingWorkspaceIsolation}
                className="group h-7 shrink-0 border-primary/30 px-3 text-xs text-primary hover:bg-primary/10"
              >
                <PlayCircle className="mr-1.5 h-3 w-3 transition-transform group-hover:scale-110" />
                Activate
              </Button>
            </div>
          </div>
        ) : null}

        {topology && realStack ? (
          <div className="overflow-hidden rounded-xl border border-primary/30 bg-primary/5 shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2.5 text-primary">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold tracking-tight">
                    Project Services active
                  </p>
                  <p className="text-[11px] font-medium opacity-80">
                    Traffic routed via secure local proxy
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDisableWorkspaceIsolation}
                disabled={isChangingWorkspaceIsolation}
                className="h-8 shrink-0 px-3 text-[11px] text-destructive shadow-none hover:bg-destructive/10"
              >
                <StopCircle className="mr-1.5 h-3.5 w-3.5" />
                Stop Env
              </Button>
            </div>

            <div className="border-t border-primary/10 bg-background/60 backdrop-blur-sm">
              <WorkspaceIsolationServices
                stack={realStack}
                open={isServicesOpen}
                onOpenChange={setIsServicesOpen}
              />
            </div>
          </div>
        ) : null}

        {realStack &&
        shellHookStatus &&
        !shellHookStatus.enabled &&
        shellHookStatus.supported ? (
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
    </div>
  );
};
