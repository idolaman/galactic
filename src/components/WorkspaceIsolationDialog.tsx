import { useState } from "react";
import { WorkspaceIsolationDialogBody } from "@/components/WorkspaceIsolationDialogBody";
import { WorkspaceIsolationDialogFooter } from "@/components/WorkspaceIsolationDialogFooter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWorkspaceIsolationDialog } from "@/hooks/use-workspace-isolation-dialog";
import { useWorkspaceIsolationManager } from "@/hooks/use-workspace-isolation-manager";
import { useAppToast } from "@/hooks/use-app-toast";
import {
  getWorkspaceIsolationDialogDescription,
  getWorkspaceIsolationDialogTitle,
} from "@/lib/workspace-isolation-dialog-copy";
import { WORKSPACE_ISOLATION_DIALOG_CONTENT_CLASS_NAME } from "@/lib/workspace-isolation-dialog-layout";
import {
  trackWorkspaceIsolationAutoEnvEnableAttempted,
  trackWorkspaceIsolationAutoEnvEnableCompleted,
} from "@/services/workspace-isolation-analytics";
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

  const handleEnableTerminalIntegration = async () => {
    trackWorkspaceIsolationAutoEnvEnableAttempted("onboarding");
    state.handleContinueToConfiguration();
    setIsEnablingLocalEnv(true);
    try {
      const result = await setShellHooksEnabled(true);
      trackWorkspaceIsolationAutoEnvEnableCompleted(
        "onboarding",
        result.success,
      );
      if (result.success) {
        success("Terminal Auto-Env enabled");
        return;
      }
      error({
        title: "Setup failed",
        description:
          result.error ?? "Failed to enable Terminal Auto-Env",
      });
    } finally {
      setIsEnablingLocalEnv(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={WORKSPACE_ISOLATION_DIALOG_CONTENT_CLASS_NAME}>
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {getWorkspaceIsolationDialogTitle(state.step, Boolean(stack))}
          </DialogTitle>
          <DialogDescription>
            {getWorkspaceIsolationDialogDescription(state.step)}
          </DialogDescription>
        </DialogHeader>

        <WorkspaceIsolationDialogBody
          step={state.step}
          projectId={projectId}
          projectName={projectName}
          workspaceRootPath={workspaceRootPath}
          workspaceRootLabel={workspaceRootLabel}
          stackId={state.draftStackId}
          draftWorkspaceMode={state.draftWorkspaceMode}
          draftServices={state.draftServices}
          workspaceIsolationStacks={state.workspaceIsolationStacks}
          onAddService={state.handleAddService}
          onChangeService={state.handleChangeService}
          onRemoveService={state.handleRemoveService}
          onAddConnection={state.handleAddConnection}
          onChangeConnection={state.handleChangeConnection}
          onRemoveConnection={state.handleRemoveConnection}
          onWorkspaceModeChange={state.handleWorkspaceModeChange}
        />

        <WorkspaceIsolationDialogFooter
          step={state.step}
          isEditing={Boolean(stack)}
          showFeatureIntroStep={state.showFeatureIntroStep}
          isEnablingLocalEnv={isEnablingLocalEnv}
          onClose={() => onOpenChange(false)}
          onDelete={state.handleDelete}
          onContinueIntro={state.handleFeatureIntroContinue}
          onBackToFeatureIntro={state.handleBackToFeatureIntro}
          onEnableAndContinue={handleEnableTerminalIntegration}
          onContinueToConnections={state.handleContinueToConnections}
          onBackToConfiguration={state.handlePrevStep}
          onSave={state.handleSave}
        />
      </DialogContent>
    </Dialog>
  );
};
