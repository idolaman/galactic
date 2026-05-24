import { AppDialogFooterBar } from "@/components/app/AppDialogFooterBar";
import { Button } from "@/components/ui/button";

interface CreateWorkspaceDialogFooterProps {
  canCreate: boolean;
  isCreatingWorkspace: boolean;
  step: "branch" | "base";
  onBack: () => void;
  onCancel: () => void;
  onCreate: () => void;
}

export const CreateWorkspaceDialogFooter = ({
  canCreate,
  isCreatingWorkspace,
  step,
  onBack,
  onCancel,
  onCreate,
}: CreateWorkspaceDialogFooterProps) => (
  <AppDialogFooterBar>
    {step === "base" ? (
      <Button variant="outline" disabled={isCreatingWorkspace} onClick={onBack}>
        Back
      </Button>
    ) : null}
    <Button variant="outline" disabled={isCreatingWorkspace} onClick={onCancel}>
      Cancel
    </Button>
    <Button disabled={!canCreate} onClick={onCreate}>
      {isCreatingWorkspace ? "Creating..." : "Create Workspace"}
    </Button>
  </AppDialogFooterBar>
);
