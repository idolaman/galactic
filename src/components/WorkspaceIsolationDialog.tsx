import { useState } from "react";
import { WorkspaceIsolationDialogActions } from "@/components/WorkspaceIsolationDialogActions";
import { WorkspaceIsolationDialogBodyFrame } from "@/components/WorkspaceIsolationDialogBodyFrame";
import { WorkspaceIsolationDialogHeader } from "@/components/WorkspaceIsolationDialogHeader";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useWorkspaceIsolationDialog } from "@/hooks/use-workspace-isolation-dialog";
import { useWorkspaceIsolationManager } from "@/hooks/use-workspace-isolation-manager";
import { useAppToast } from "@/hooks/use-app-toast";
import { WORKSPACE_ISOLATION_DIALOG_CONTENT_CLASS_NAME } from "@/lib/workspace-isolation-dialog-layout";
import {
  trackWorkspaceIsolationAutoEnvEnableAttempted,
  trackWorkspaceIsolationAutoEnvEnableCompleted,
} from "@/services/workspace-isolation-analytics";
import type { WorkspaceActivationTarget, WorkspaceIsolationProjectTopology } from "@/types/workspace-isolation";

interface WorkspaceIsolationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  workspaceRootPath: string;
  workspaceRootLabel: string;
  projectName: string;
  activationTargets: WorkspaceActivationTarget[];
  stack?: WorkspaceIsolationProjectTopology | null;
}

export const WorkspaceIsolationDialog = ({
  open,
  onOpenChange,
  projectId,
  workspaceRootPath,
  workspaceRootLabel,
  projectName,
  activationTargets,
  stack,
}: WorkspaceIsolationDialogProps) => {
  const state = useWorkspaceIsolationDialog({
    open,
    onOpenChange,
    projectId,
    workspaceRootPath,
    workspaceRootLabel,
    projectName,
    activationTargets,
    stack,
  });
  const { setShellHooksEnabled } = useWorkspaceIsolationManager();
  const { error } = useAppToast();
  const [isEnablingLocalEnv, setIsEnablingLocalEnv] = useState(false);

  const handleEnableTerminalIntegration = async () => {
    trackWorkspaceIsolationAutoEnvEnableAttempted("onboarding");
    state.handleContinueToConfiguration();
    setIsEnablingLocalEnv(true);
    try {
      const result = await setShellHooksEnabled(true);
      trackWorkspaceIsolationAutoEnvEnableCompleted("onboarding", result.success);
      if (!result.success) {
        error({
          title: "Setup failed",
          description: result.error ?? "Failed to enable Terminal Auto-Env",
        });
      }
    } finally {
      setIsEnablingLocalEnv(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={WORKSPACE_ISOLATION_DIALOG_CONTENT_CLASS_NAME}>
        <WorkspaceIsolationDialogHeader
          isEditing={Boolean(stack)}
          step={state.step}
          useFullSetupSteps={state.useFullSetupSteps}
        />

        <WorkspaceIsolationDialogBodyFrame
          step={state.step}
          projectId={projectId}
          projectName={projectName}
          workspaceRootPath={workspaceRootPath}
          workspaceRootLabel={workspaceRootLabel}
          stackId={state.draftStackId}
          draftWorkspaceMode={state.draftWorkspaceMode}
          draftServices={state.draftServices}
          activationTargets={state.selectableActivationTargets}
          proxyStatus={state.proxyStatus}
          shellHookStatus={state.shellHookStatus}
          selectedActivationTargetPath={state.selectedActivationTargetPath}
          workspaceIsolationProjectTopologies={state.workspaceIsolationProjectTopologies}
          workspaceIsolationStacks={state.workspaceIsolationStacks}
          onAddService={state.handleAddService}
          onChangeService={state.handleChangeService}
          onRemoveService={state.handleRemoveService}
          onAddConnection={state.handleAddConnection}
          onChangeConnection={state.handleChangeConnection}
          onRemoveConnection={state.handleRemoveConnection}
          onWorkspaceModeChange={state.handleWorkspaceModeChange}
          onSelectActivationTarget={state.handleSelectActivationTarget}
        />

        <WorkspaceIsolationDialogActions
          step={state.step}
          isEditing={Boolean(stack)}
          showFeatureIntroStep={state.showFeatureIntroStep}
          isEnablingLocalEnv={isEnablingLocalEnv}
          activationButtonLabel={state.activationButtonLabel}
          isActivatingSelectedWorkspace={state.isActivatingSelectedWorkspace}
          onClose={() => onOpenChange(false)}
          onDelete={state.handleDelete}
          onContinueIntro={state.handleFeatureIntroContinue}
          onBackToFeatureIntro={state.handleBackToFeatureIntro}
          onEnableAndContinue={handleEnableTerminalIntegration}
          onContinueToConnections={state.handleContinueToConnections}
          onBackToConfiguration={state.handlePrevStep}
          onSave={state.handleSave}
          onActivateSelectedWorkspace={state.handleActivateSelectedWorkspace}
          onFinishWithoutActivation={state.handleFinishWithoutActivation}
        />
      </DialogContent>
    </Dialog>
  );
};
