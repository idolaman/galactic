import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkspaceIsolationDialogLead } from "@/components/WorkspaceIsolationDialogLead";
import { WorkspaceIsolationDialogServiceCard } from "@/components/WorkspaceIsolationDialogServiceCard";
import { WorkspaceIsolationDialogSingleAppState } from "@/components/WorkspaceIsolationDialogSingleAppState";
import { ScrollArea } from "@/components/ui/scroll-area";
import { isSingleAppOverviewStep } from "@/lib/workspace-isolation-dialog-layout";
import type { WorkspaceIsolationDialogStep } from "@/lib/workspace-isolation-dialog-step";
import type {
  WorkspaceIsolationConnection,
  WorkspaceIsolationMode,
  WorkspaceIsolationProjectTopology,
  WorkspaceIsolationService,
  WorkspaceIsolationStack,
} from "@/types/workspace-isolation";

interface WorkspaceIsolationDialogConfigurationStepProps {
  step: WorkspaceIsolationDialogStep;
  projectId: string;
  projectName: string;
  workspaceRootPath: string;
  workspaceRootLabel: string;
  stackId: string;
  draftWorkspaceMode: WorkspaceIsolationMode;
  draftServices: WorkspaceIsolationService[];
  workspaceIsolationProjectTopologies: WorkspaceIsolationProjectTopology[];
  workspaceIsolationStacks: WorkspaceIsolationStack[];
  onAddService: () => void;
  onChangeService: (
    serviceId: string,
    updates: Partial<WorkspaceIsolationService>,
  ) => void;
  onRemoveService: (serviceId: string) => void;
  onAddConnection: (serviceId: string) => void;
  onChangeConnection: (
    serviceId: string,
    linkId: string,
    updates: Partial<WorkspaceIsolationConnection>,
  ) => void;
  onRemoveConnection: (serviceId: string, linkId: string) => void;
  onWorkspaceModeChange: (value: WorkspaceIsolationMode) => void;
}

export const WorkspaceIsolationDialogConfigurationStep = ({
  step,
  projectId,
  projectName,
  workspaceRootPath,
  workspaceRootLabel,
  stackId,
  draftWorkspaceMode,
  draftServices,
  workspaceIsolationProjectTopologies,
  workspaceIsolationStacks,
  onAddService,
  onChangeService,
  onRemoveService,
  onAddConnection,
  onChangeConnection,
  onRemoveConnection,
  onWorkspaceModeChange,
}: WorkspaceIsolationDialogConfigurationStepProps) => {
  const lead = (
    <WorkspaceIsolationDialogLead
      step={step}
      workspaceRootPath={workspaceRootPath}
      workspaceRootLabel={workspaceRootLabel}
      workspaceMode={draftWorkspaceMode}
      onWorkspaceModeChange={onWorkspaceModeChange}
    />
  );

  if (isSingleAppOverviewStep(step, draftWorkspaceMode)) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-6">
        {lead}
        <WorkspaceIsolationDialogSingleAppState className="flex-1" />
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 -mr-4 pr-4">
      <div className="grid gap-6">
        {lead}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">Services</h3>
              <p className="text-xs text-muted-foreground">
                {step === 3
                  ? "Define folders for services in this monorepo."
                  : "Define environment variable connections for each service."}
              </p>
            </div>
            {step === 3 && draftWorkspaceMode === "monorepo" ? (
              <Button size="sm" variant="secondary" onClick={onAddService}>
                <Plus className="h-4 w-4" />
                Add Service
              </Button>
            ) : null}
          </div>

          <div className="grid gap-4">
            {draftServices.map((service) => (
              <WorkspaceIsolationDialogServiceCard
                key={service.id}
                projectId={projectId}
                projectName={projectName}
                workspaceRootPath={workspaceRootPath}
                workspaceLabel={workspaceRootLabel}
                stackId={stackId}
                service={service}
                workspaceMode={draftWorkspaceMode}
                services={draftServices}
                workspaceIsolationProjectTopologies={workspaceIsolationProjectTopologies}
                workspaceIsolationStacks={workspaceIsolationStacks}
                step={step}
                onChangeService={onChangeService}
                onRemoveService={onRemoveService}
                onAddConnection={onAddConnection}
                onChangeConnection={onChangeConnection}
                onRemoveConnection={onRemoveConnection}
              />
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};
