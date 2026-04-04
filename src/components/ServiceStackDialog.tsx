import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ServiceStackDialogServiceCard } from "@/components/ServiceStackDialogServiceCard";
import { ServiceStackDialogSingleAppState } from "@/components/ServiceStackDialogSingleAppState";
import { WorkspaceIsolationModeField } from "@/components/WorkspaceIsolationModeField";
import { useServiceStackDialog } from "@/hooks/use-service-stack-dialog";
import {
  SERVICE_STACK_DIALOG_CONTENT_CLASS_NAME,
  isSingleAppOverviewStep,
} from "@/lib/service-stack-dialog-layout";
import type { ServiceStackEnvironment } from "@/types/service-stack";

interface ServiceStackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  workspaceRootPath: string;
  workspaceRootLabel: string;
  projectName: string;
  stack?: ServiceStackEnvironment | null;
}

export const ServiceStackDialog = ({
  open,
  onOpenChange,
  projectId,
  workspaceRootPath,
  workspaceRootLabel,
  projectName,
  stack,
}: ServiceStackDialogProps) => {
  const state = useServiceStackDialog({
    open,
    onOpenChange,
    projectId,
    workspaceRootPath,
    workspaceRootLabel,
    projectName,
    stack,
  });
  const isSingleAppStep = isSingleAppOverviewStep(
    state.step,
    state.draftWorkspaceMode,
  );
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

      {state.step === 1 ? (
        <WorkspaceIsolationModeField
          value={state.draftWorkspaceMode}
          onChange={state.handleWorkspaceModeChange}
        />
      ) : null}
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={SERVICE_STACK_DIALOG_CONTENT_CLASS_NAME}>
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {state.step === 1 
              ? (stack ? "Edit Workspace Isolation" : "Isolate Workspace") 
              : "Map Connections"}
          </DialogTitle>
          <DialogDescription>
            {state.step === 1
              ? "Configure the services Galactic will route into this workspace."
              : "Map environment variables to other services in this workspace or across Galactic projects."}
          </DialogDescription>
        </DialogHeader>

        {isSingleAppStep ? (
          <div className="flex flex-1 min-h-0 flex-col gap-6">
            {dialogLead}
            <ServiceStackDialogSingleAppState className="flex-1" />
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
                      {state.step === 1
                        ? "Define folders for services in this monorepo."
                        : "Define environment variable connections for each service."}
                    </p>
                  </div>
                  {state.step === 1 && state.draftWorkspaceMode === "monorepo" ? (
                    <Button size="sm" variant="secondary" onClick={state.handleAddService}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Service
                    </Button>
                  ) : null}
                </div>

                <div className="grid gap-4">
                  {state.draftServices.map((service) => (
                    <ServiceStackDialogServiceCard
                      key={service.id}
                      projectId={projectId}
                      projectName={projectName}
                      workspaceRootPath={workspaceRootPath}
                      workspaceLabel={workspaceRootLabel}
                      stackId={state.draftStackId}
                      service={service}
                      workspaceMode={state.draftWorkspaceMode}
                      services={state.draftServices}
                      serviceStacks={state.serviceStacks}
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
          {stack && state.step === 1 ? (
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
