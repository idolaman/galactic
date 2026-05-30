import { AppDialogStepIndicator } from "@/components/app/AppDialogStepIndicator";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CreateWorkspaceDialogHeaderProps {
  step: "branch" | "base";
}

const createWorkspaceSteps = [
  { id: "branch", label: "Branch" },
  { id: "base", label: "Base" },
];

export const CreateWorkspaceDialogHeader = ({
  step,
}: CreateWorkspaceDialogHeaderProps) => (
  <DialogHeader className="space-y-0 gap-3 border-b px-5 py-4">
    <AppDialogStepIndicator activeStepId={step} steps={createWorkspaceSteps} />
    <DialogTitle>Create New Workspace</DialogTitle>
    <DialogDescription>
      Choose an existing branch or create a new branch-backed workspace.
    </DialogDescription>
  </DialogHeader>
);
