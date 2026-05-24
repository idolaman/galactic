import { GitBranch } from "lucide-react";

import { CreateWorkspaceDialogBody } from "@/components/CreateWorkspaceDialogBody";
import { CreateWorkspaceDialogFooter } from "@/components/CreateWorkspaceDialogFooter";
import { CreateWorkspaceDialogHeader } from "@/components/CreateWorkspaceDialogHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCreateWorkspaceDialog } from "@/hooks/use-create-workspace-dialog";
import {
  canCreateWorkspaceFromExistingBranch,
  canCreateWorkspaceFromNewBranch,
  normalizeBaseBranch,
} from "@/lib/create-workspace-flow";
import type { CreateWorkspaceRequest } from "@/lib/create-workspace-request";

interface CreateWorkspaceDialogProps {
  projectPath: string;
  gitBranches: string[];
  isLoadingBranches?: boolean;
  isCreatingWorkspace?: boolean;
  onCreateWorkspace: (request: CreateWorkspaceRequest) => Promise<boolean>;
  onLoadBranches?: () => void | Promise<void>;
  triggerSize?: "default" | "sm";
}

export const CreateWorkspaceDialog = ({
  projectPath,
  gitBranches,
  isLoadingBranches = false,
  isCreatingWorkspace = false,
  onCreateWorkspace,
  onLoadBranches,
  triggerSize = "default",
}: CreateWorkspaceDialogProps) => {
  const {
    baseBranchInput,
    baseBranches,
    branchInput,
    handleBranchInputChange,
    handleBaseBranchInputChange,
    handleCreateFromExisting,
    handleCreateFromNew,
    handleOpenChange,
    isLoadingBaseBranches,
    isOpen,
    pendingNewBranch,
    selectedExistingBranch,
    selectedBaseBranch,
    setBaseBranchInput,
    setPendingNewBranch,
    setSelectedExistingBranch,
    setSelectedBaseBranch,
    setStep,
    step,
  } = useCreateWorkspaceDialog({
    projectPath,
    isCreatingWorkspace,
    onCreateWorkspace,
    onLoadBranches,
  });
  const canCreateExisting = canCreateWorkspaceFromExistingBranch(
    selectedExistingBranch,
    isCreatingWorkspace,
  );
  const canCreateNew = canCreateWorkspaceFromNewBranch(
    normalizeBaseBranch(selectedBaseBranch),
    isCreatingWorkspace || isLoadingBaseBranches,
  );
  const handleBack = () => {
    setBaseBranchInput("");
    setSelectedBaseBranch("");
    setStep("branch");
  };
  const handleCreate = () => {
    if (step === "branch") {
      void handleCreateFromExisting(selectedExistingBranch);
      return;
    }
    void handleCreateFromNew();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2" disabled={isCreatingWorkspace} size={triggerSize}>
          <GitBranch className="h-4 w-4" />
          New Workspace
        </Button>
      </DialogTrigger>
      <DialogContent
        className="overflow-hidden p-0 sm:max-w-2xl"
        onEscapeKeyDown={(event) => isCreatingWorkspace && event.preventDefault()}
        onPointerDownOutside={(event) => isCreatingWorkspace && event.preventDefault()}
      >
        <CreateWorkspaceDialogHeader step={step} />
        <CreateWorkspaceDialogBody
          baseBranchInput={baseBranchInput}
          baseBranches={baseBranches}
          branchInput={branchInput}
          branchName={pendingNewBranch}
          gitBranches={gitBranches}
          isCreatingWorkspace={isCreatingWorkspace}
          isLoadingBaseBranches={isLoadingBaseBranches}
          isLoadingBranches={isLoadingBranches}
          selectedBaseBranch={selectedBaseBranch}
          selectedExistingBranch={selectedExistingBranch}
          step={step}
          onBaseBranchInputChange={handleBaseBranchInputChange}
          onBranchInputChange={handleBranchInputChange}
          onChooseBaseBranch={setPendingNewBranch}
          onSelectBaseBranch={setSelectedBaseBranch}
          onSelectBranch={setSelectedExistingBranch}
        />
        <CreateWorkspaceDialogFooter
          canCreate={step === "branch" ? canCreateExisting : canCreateNew}
          isCreatingWorkspace={isCreatingWorkspace}
          step={step}
          onBack={handleBack}
          onCancel={() => handleOpenChange(false)}
          onCreate={handleCreate}
        />
      </DialogContent>
    </Dialog>
  );
};
