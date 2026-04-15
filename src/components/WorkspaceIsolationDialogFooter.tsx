import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import type { WorkspaceIsolationDialogStep } from "@/lib/workspace-isolation-dialog-step";

interface WorkspaceIsolationDialogFooterProps {
  step: WorkspaceIsolationDialogStep;
  isEditing: boolean;
  showFeatureIntroStep: boolean;
  isEnablingLocalEnv: boolean;
  onClose: () => void;
  onDelete: () => void;
  onContinueIntro: () => void;
  onBackToFeatureIntro: () => void;
  onEnableAndContinue: () => void;
  onContinueToConnections: () => void;
  onBackToConfiguration: () => void;
  onSave: () => void;
}

export const WorkspaceIsolationDialogFooter = ({
  step,
  isEditing,
  showFeatureIntroStep,
  isEnablingLocalEnv,
  onClose,
  onDelete,
  onContinueIntro,
  onBackToFeatureIntro,
  onEnableAndContinue,
  onContinueToConnections,
  onBackToConfiguration,
  onSave,
}: WorkspaceIsolationDialogFooterProps) => (
  <DialogFooter className="shrink-0 gap-2 pt-4 sm:justify-between">
    {isEditing && step === 3 ? (
      <Button variant="destructive" onClick={onDelete}>
        Remove Topology
      </Button>
    ) : (
      <div />
    )}
    <div className="flex flex-col-reverse gap-2 sm:flex-row">
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
          <Button onClick={onSave}>
            {isEditing ? "Save Topology" : "Save Project Topology"}
          </Button>
        </>
      ) : null}
    </div>
  </DialogFooter>
);
