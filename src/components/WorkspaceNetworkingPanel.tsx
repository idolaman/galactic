import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ShieldCheck, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
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
          <div className="flex items-center justify-between gap-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                <AlertTriangle className="h-4 w-4" />
                <p className="text-sm font-medium">Auto-Env is not enabled</p>
              </div>
              <p className="text-xs text-amber-600/80 dark:text-amber-500/80">
                Commands like 'npm run dev' won't automatically use the correct local domains.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 border-amber-500/30 text-amber-600 hover:bg-amber-500/20 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400"
              onClick={handleEnableTerminalIntegration}
              disabled={isEnablingLocalEnv}
            >
              Set up Auto-Env
            </Button>
          </div>
        ) : stack && shellHookStatus?.enabled ? (
          <div className="flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 shadow-sm transition-all duration-200">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/20 text-primary">
                    <Terminal className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Terminal Auto-Env is active</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Galactic intelligently injects <code className="rounded bg-black/5 px-1 py-0.5 dark:bg-white/10">PORT</code> and <code className="rounded bg-black/5 px-1 py-0.5 dark:bg-white/10">GALACTIC_</code> variables directly into your zsh terminal. There's no need to manually set ports. Simply run your dev script as usual:
                </p>
              </div>
            </div>
            <div className="mt-1 grid gap-2">
              {stack.services.map((service) => (
                <div key={service.id} className="group flex flex-col gap-1 rounded-md border border-black/5 bg-background/60 p-2.5 transition-colors hover:bg-background/80 dark:border-white/5">
                  <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70">
                    {service.id === "default" ? stack.workspaceRootLabel : service.id}
                  </span>
                  <span className="font-mono text-[11px] text-foreground/90">
                    {service.relativePath === "." ? "" : `cd ${service.relativePath} && `}npm run dev
                  </span>
                </div>
              ))}
            </div>
          </div>
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
