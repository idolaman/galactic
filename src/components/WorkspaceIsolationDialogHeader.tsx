import { AppDialogStepIndicator } from "@/components/app/AppDialogStepIndicator";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getWorkspaceIsolationDialogDescription,
  getWorkspaceIsolationDialogTitle,
} from "@/lib/workspace-isolation-dialog-copy";
import {
  getWorkspaceIsolationDialogStepId,
  getWorkspaceIsolationDialogSteps,
} from "@/lib/workspace-isolation-dialog-steps";
import type { WorkspaceIsolationDialogStep } from "@/lib/workspace-isolation-dialog-step";

interface WorkspaceIsolationDialogHeaderProps {
  isEditing: boolean;
  step: WorkspaceIsolationDialogStep;
  useFullSetupSteps: boolean;
}

export const WorkspaceIsolationDialogHeader = ({
  isEditing,
  step,
  useFullSetupSteps,
}: WorkspaceIsolationDialogHeaderProps) => (
  <DialogHeader className="shrink-0 space-y-0 gap-3 border-b px-5 py-4">
    <AppDialogStepIndicator
      activeStepId={getWorkspaceIsolationDialogStepId(step)}
      steps={getWorkspaceIsolationDialogSteps(step, useFullSetupSteps)}
    />
    <DialogTitle>{getWorkspaceIsolationDialogTitle(step, isEditing)}</DialogTitle>
    <DialogDescription>
      {getWorkspaceIsolationDialogDescription(step)}
    </DialogDescription>
  </DialogHeader>
);
