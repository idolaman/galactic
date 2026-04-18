import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import type { WorkspaceIsolationDialogStep } from "@/lib/workspace-isolation-dialog-step";

interface WorkspaceIsolationDialogFooterProps {
  step: WorkspaceIsolationDialogStep;
  isEditing: boolean;
  showFeatureIntroStep: boolean;
  isEnablingLocalEnv: boolean;
  activationButtonLabel: string;
  isActivatingSelectedWorkspace: boolean;
  onClose: () => void;
  onDelete: () => void;
  onContinueIntro: () => void;
  onBackToFeatureIntro: () => void;
  onEnableAndContinue: () => void;
  onContinueToConnections: () => void;
  onBackToConfiguration: () => void;
  onSave: () => void;
  onActivateSelectedWorkspace: () => void;
  onFinishWithoutActivation: () => void;
}

export const WorkspaceIsolationDialogFooter = ({
  step,
  isEditing,
  showFeatureIntroStep,
  isEnablingLocalEnv,
  activationButtonLabel,
  isActivatingSelectedWorkspace,
  onClose,
  onDelete,
  onContinueIntro,
  onBackToFeatureIntro,
  onEnableAndContinue,
  onContinueToConnections,
  onBackToConfiguration,
  onSave,
  onActivateSelectedWorkspace,
  onFinishWithoutActivation,
}: WorkspaceIsolationDialogFooterProps) => (
  <DialogFooter className="shrink-0 gap-2 pt-4 sm:justify-between">
    {isEditing && step === 3 ? (
      <Button variant="destructive" onClick={onDelete}>
        Remove Project Services
      </Button>
    ) : (
      <div />
    )}
    <div className="flex min-w-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      {step === 1 ? (
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onContinueIntro}>Continue</Button>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <Button
            variant="outline"
            onClick={showFeatureIntroStep ? onBackToFeatureIntro : onClose}
          >
            {showFeatureIntroStep ? "Back" : "Cancel"}
          </Button>
          <Button onClick={onEnableAndContinue} disabled={isEnablingLocalEnv}>
            {isEnablingLocalEnv ? "Enabling..." : "Enable & Continue"}
          </Button>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onContinueToConnections}>Next</Button>
        </>
      ) : null}

      {step === 4 ? (
        <>
          <Button variant="outline" onClick={onBackToConfiguration}>
            Back
          </Button>
          <Button onClick={onSave}>Save Project Services</Button>
        </>
      ) : null}

      {step === 5 ? (
        <>
          <Button variant="outline" onClick={onFinishWithoutActivation} className="shrink-0">
            Done for now
          </Button>
          <Button
            onClick={onActivateSelectedWorkspace}
            disabled={isActivatingSelectedWorkspace}
            className="max-w-full overflow-hidden sm:max-w-[350px]"
          >
            <span className="truncate">
              {isActivatingSelectedWorkspace
                ? "Activating..."
                : activationButtonLabel}
            </span>
          </Button>
        </>
      ) : null}
    </div>
  </DialogFooter>
);
