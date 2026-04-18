import { WorkspaceIsolationActivateWorkspaceStep } from "@/components/WorkspaceIsolationActivateWorkspaceStep";
import { WorkspaceIsolationAutoEnvStep } from "@/components/WorkspaceIsolationAutoEnvStep";
import { WorkspaceIsolationDialogConfigurationStep } from "@/components/WorkspaceIsolationDialogConfigurationStep";
import { WorkspaceIsolationIntroStep } from "@/components/WorkspaceIsolationIntroStep";
import type { WorkspaceIsolationDialogStep } from "@/lib/workspace-isolation-dialog-step";
import type {
  WorkspaceIsolationProxyStatus,
  WorkspaceIsolationShellHookStatus,
} from "@/types/electron";
import type {
  WorkspaceActivationTarget,
  WorkspaceIsolationConnection,
  WorkspaceIsolationMode,
  WorkspaceIsolationProjectTopology,
  WorkspaceIsolationService,
  WorkspaceIsolationStack,
} from "@/types/workspace-isolation";

interface WorkspaceIsolationDialogBodyProps {
  step: WorkspaceIsolationDialogStep;
  projectId: string;
  projectName: string;
  workspaceRootPath: string;
  workspaceRootLabel: string;
  stackId: string;
  draftWorkspaceMode: WorkspaceIsolationMode;
  draftServices: WorkspaceIsolationService[];
  activationTargets: WorkspaceActivationTarget[];
  proxyStatus: WorkspaceIsolationProxyStatus;
  shellHookStatus: WorkspaceIsolationShellHookStatus | null;
  selectedActivationTargetPath: string | null;
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
  onSelectActivationTarget: (path: string) => void;
}

export const WorkspaceIsolationDialogBody = ({
  step,
  projectId,
  projectName,
  workspaceRootPath,
  workspaceRootLabel,
  stackId,
  draftWorkspaceMode,
  draftServices,
  activationTargets,
  proxyStatus,
  shellHookStatus,
  selectedActivationTargetPath,
  workspaceIsolationProjectTopologies,
  workspaceIsolationStacks,
  onAddService,
  onChangeService,
  onRemoveService,
  onAddConnection,
  onChangeConnection,
  onRemoveConnection,
  onWorkspaceModeChange,
  onSelectActivationTarget,
}: WorkspaceIsolationDialogBodyProps) => {
  if (step === 1) {
    return <WorkspaceIsolationIntroStep />;
  }
  if (step === 2) {
    return <WorkspaceIsolationAutoEnvStep />;
  }
  if (step === 5) {
    return (
      <WorkspaceIsolationActivateWorkspaceStep
        activationTargets={activationTargets}
        selectedTargetPath={selectedActivationTargetPath}
        proxyStatus={proxyStatus}
        shellHookStatus={shellHookStatus}
        onSelectTarget={onSelectActivationTarget}
      />
    );
  }

  return (
    <WorkspaceIsolationDialogConfigurationStep
      step={step}
      projectId={projectId}
      projectName={projectName}
      workspaceRootPath={workspaceRootPath}
      workspaceRootLabel={workspaceRootLabel}
      stackId={stackId}
      draftWorkspaceMode={draftWorkspaceMode}
      draftServices={draftServices}
      workspaceIsolationProjectTopologies={workspaceIsolationProjectTopologies}
      workspaceIsolationStacks={workspaceIsolationStacks}
      onAddService={onAddService}
      onChangeService={onChangeService}
      onRemoveService={onRemoveService}
      onAddConnection={onAddConnection}
      onChangeConnection={onChangeConnection}
      onRemoveConnection={onRemoveConnection}
      onWorkspaceModeChange={onWorkspaceModeChange}
    />
  );
};
