import { useState } from "react";

import { WorkspaceIsolationDeleteConfirmationDialog } from "@/components/WorkspaceIsolationDeleteConfirmationDialog";
import { WorkspaceIsolationDialogFooter } from "@/components/WorkspaceIsolationDialogFooter";
import type { WorkspaceIsolationDialogStep } from "@/lib/workspace-isolation-dialog-step";

interface WorkspaceIsolationDialogActionsProps {
  activationButtonLabel: string;
  isActivatingSelectedWorkspace: boolean;
  isEditing: boolean;
  isEnablingLocalEnv: boolean;
  showFeatureIntroStep: boolean;
  step: WorkspaceIsolationDialogStep;
  onActivateSelectedWorkspace: () => void;
  onBackToConfiguration: () => void;
  onBackToFeatureIntro: () => void;
  onClose: () => void;
  onContinueIntro: () => void;
  onContinueToConnections: () => void;
  onDelete: () => Promise<void> | void;
  onEnableAndContinue: () => void;
  onFinishWithoutActivation: () => void;
  onSave: () => void;
}

export const WorkspaceIsolationDialogActions = ({
  activationButtonLabel,
  isActivatingSelectedWorkspace,
  isEditing,
  isEnablingLocalEnv,
  showFeatureIntroStep,
  step,
  onActivateSelectedWorkspace,
  onBackToConfiguration,
  onBackToFeatureIntro,
  onClose,
  onContinueIntro,
  onContinueToConnections,
  onDelete,
  onEnableAndContinue,
  onFinishWithoutActivation,
  onSave,
}: WorkspaceIsolationDialogActionsProps) => {
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isRemovingProjectServices, setIsRemovingProjectServices] = useState(false);

  const handleConfirmDelete = async () => {
    let didCloseAfterDelete = false;
    setIsRemovingProjectServices(true);
    try {
      await onDelete();
      didCloseAfterDelete = true;
      setIsDeleteConfirmOpen(false);
    } finally {
      if (!didCloseAfterDelete) {
        setIsRemovingProjectServices(false);
      }
    }
  };

  const handleDeleteExitComplete = () => {
    if (!isDeleteConfirmOpen) {
      setIsRemovingProjectServices(false);
    }
  };

  return (
    <>
      <WorkspaceIsolationDialogFooter
        step={step}
        isEditing={isEditing}
        showFeatureIntroStep={showFeatureIntroStep}
        isEnablingLocalEnv={isEnablingLocalEnv}
        activationButtonLabel={activationButtonLabel}
        isActivatingSelectedWorkspace={isActivatingSelectedWorkspace}
        onClose={onClose}
        onDelete={() => setIsDeleteConfirmOpen(true)}
        onContinueIntro={onContinueIntro}
        onBackToFeatureIntro={onBackToFeatureIntro}
        onEnableAndContinue={onEnableAndContinue}
        onContinueToConnections={onContinueToConnections}
        onBackToConfiguration={onBackToConfiguration}
        onSave={onSave}
        onActivateSelectedWorkspace={onActivateSelectedWorkspace}
        onFinishWithoutActivation={onFinishWithoutActivation}
      />
      <WorkspaceIsolationDeleteConfirmationDialog
        isRemoving={isRemovingProjectServices}
        open={isDeleteConfirmOpen}
        onConfirm={() => void handleConfirmDelete()}
        onExitComplete={handleDeleteExitComplete}
        onOpenChange={(nextOpen) => {
          if (!isRemovingProjectServices) {
            setIsDeleteConfirmOpen(nextOpen);
          }
        }}
      />
    </>
  );
};
