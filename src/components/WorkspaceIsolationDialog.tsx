import { useState } from "react";
import { Network, Plus, Terminal, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WorkspaceIsolationDialogServiceCard } from "@/components/WorkspaceIsolationDialogServiceCard";
import { WorkspaceIsolationDialogSingleAppState } from "@/components/WorkspaceIsolationDialogSingleAppState";
import { WorkspaceIsolationModeField } from "@/components/WorkspaceIsolationModeField";
import { useWorkspaceIsolationDialog } from "@/hooks/use-workspace-isolation-dialog";
import {
  WORKSPACE_ISOLATION_DIALOG_CONTENT_CLASS_NAME,
  isSingleAppOverviewStep,
} from "@/lib/workspace-isolation-dialog-layout";
import { useWorkspaceIsolationManager } from "@/hooks/use-workspace-isolation-manager";
import { useAppToast } from "@/hooks/use-app-toast";
import type { WorkspaceIsolationStack } from "@/types/workspace-isolation";

interface WorkspaceIsolationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  workspaceRootPath: string;
  workspaceRootLabel: string;
  projectName: string;
  stack?: WorkspaceIsolationStack | null;
}

export const WorkspaceIsolationDialog = ({
  open,
  onOpenChange,
  projectId,
  workspaceRootPath,
  workspaceRootLabel,
  projectName,
  stack,
}: WorkspaceIsolationDialogProps) => {
  const state = useWorkspaceIsolationDialog({
    open,
    onOpenChange,
    projectId,
    workspaceRootPath,
    workspaceRootLabel,
    projectName,
    stack,
  });
  const { setShellHooksEnabled } = useWorkspaceIsolationManager();
  const { error, success } = useAppToast();
  const [isEnablingLocalEnv, setIsEnablingLocalEnv] = useState(false);

  const isSingleAppStep = isSingleAppOverviewStep(
    state.step,
    state.draftWorkspaceMode,
  );

  const handleEnableTerminalIntegration = async () => {
    state.handleContinueToConfiguration();
    setIsEnablingLocalEnv(true);
    try {
      const result = await setShellHooksEnabled(true);
      if (result.success) {
        success("Terminal Auto-Env enabled");
      } else {
        error({ title: "Setup failed", description: result.error ?? "Failed to enable Terminal Auto-Env" });
      }
    } finally {
      setIsEnablingLocalEnv(false);
    }
  };

  const dialogLead = (
    <>
      <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-3">
          <Badge variant="secondary">{workspaceRootLabel}</Badge>
          <span className="font-mono text-xs text-muted-foreground">
            {workspaceRootPath}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">Workspace Root</span>
      </div>

      {state.step === 2 ? (
        <WorkspaceIsolationModeField
          value={state.draftWorkspaceMode}
          onChange={state.handleWorkspaceModeChange}
        />
      ) : null}
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={WORKSPACE_ISOLATION_DIALOG_CONTENT_CLASS_NAME}>
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {state.step === 1 
              ? "Welcome to Workspace Isolation"
              : state.step === 2 
              ? (stack ? "Edit Workspace Isolation" : "Isolate Workspace") 
              : "Map Connections"}
          </DialogTitle>
          <DialogDescription>
            {state.step === 1
              ? "Seamlessly connect your external terminal commands with Galactic's local domains."
              : state.step === 2
              ? "Configure the services Galactic will route into this workspace."
              : "Map environment variables to other services in this workspace or across Galactic projects."}
          </DialogDescription>
        </DialogHeader>

        {state.step === 1 ? (
          <div className="flex flex-1 flex-col justify-center gap-6 py-4">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Network className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">1. What is Workspace Isolation?</h4>
                  <p className="text-xs text-muted-foreground">It allows you to safely run multiple branches of your stack simultaneously. Galactic gives every service a clean local domain (e.g., api.project.local) so you never deal with localhost collisions.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Terminal className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">2. Why do you need Auto-Env?</h4>
                  <p className="text-xs text-muted-foreground">Under the hood, those clean domains route to randomized ports. To use these domains, your terminal needs to know exactly which dynamic port Galactic assigned when you run commands like 'npm run dev'.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">3. What Auto-Env actually does</h4>
                  <p className="text-xs text-muted-foreground">It adds a tiny, secure hook to your ~/.zshrc. Every time you cd into a service folder, it automatically injects the correct PORT variable so your server starts in the right place.</p>
                </div>
              </div>
            </div>
            
            {state.requiresAutoEnvSetup ? (
              <div className="rounded-md bg-amber-500/10 p-3 text-sm text-center font-medium text-amber-600 dark:text-amber-500 border border-amber-500/30">
                To bridge your terminal smoothly, please enable Auto-Env before continuing.
              </div>
            ) : null}
          </div>
        ) : isSingleAppStep ? (
          <div className="flex flex-1 min-h-0 flex-col gap-6">
            {dialogLead}
            <WorkspaceIsolationDialogSingleAppState className="flex-1" />
          </div>
        ) : (
          <ScrollArea className="flex-1 -mr-4 pr-4">
            <div className="grid gap-6">
              {dialogLead}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Services</h3>
                    <p className="text-xs text-muted-foreground">
                      {state.step === 2
                        ? "Define folders for services in this monorepo."
                        : "Define environment variable connections for each service."}
                    </p>
                  </div>
                  {state.step === 2 && state.draftWorkspaceMode === "monorepo" ? (
                    <Button size="sm" variant="secondary" onClick={state.handleAddService}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Service
                    </Button>
                  ) : null}
                </div>

                <div className="grid gap-4">
                  {state.draftServices.map((service) => (
                    <WorkspaceIsolationDialogServiceCard
                      key={service.id}
                      projectId={projectId}
                      projectName={projectName}
                      workspaceRootPath={workspaceRootPath}
                      workspaceLabel={workspaceRootLabel}
                      stackId={state.draftStackId}
                      service={service}
                      workspaceMode={state.draftWorkspaceMode}
                      services={state.draftServices}
                      workspaceIsolationStacks={state.workspaceIsolationStacks}
                      step={state.step}
                      onChangeService={state.handleChangeService}
                      onRemoveService={state.handleRemoveService}
                      onAddConnection={state.handleAddConnection}
                      onChangeConnection={state.handleChangeConnection}
                      onRemoveConnection={state.handleRemoveConnection}
                    />
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="gap-2 sm:justify-between shrink-0 pt-4">
          {stack && state.step === 2 ? (
            <Button variant="destructive" onClick={state.handleDelete}>
              Remove Isolation
            </Button>
          ) : (
            <div />
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            {state.step === 1 ? (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                {state.requiresAutoEnvSetup ? (
                  <Button onClick={handleEnableTerminalIntegration} disabled={isEnablingLocalEnv}>
                    {isEnablingLocalEnv ? "Enabling..." : "Enable & Continue"}
                  </Button>
                ) : (
                  <Button onClick={state.handleContinueToConfiguration}>
                    Continue
                  </Button>
                )}
              </>
            ) : state.step === 2 ? (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={state.handleNextStep}>
                  Next
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={state.handlePrevStep}>
                  Back
                </Button>
                <Button onClick={state.handleSave}>
                  {stack ? "Save Isolation" : "Isolate Workspace"}
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
