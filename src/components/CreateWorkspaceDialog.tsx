import { GitBranch } from "lucide-react";
import { CreateWorkspaceBaseBranchStep } from "@/components/CreateWorkspaceBaseBranchStep";
import { CreateWorkspaceBranchStep } from "@/components/CreateWorkspaceBranchStep";
import { CreateWorkspaceDialogIntro } from "@/components/CreateWorkspaceDialogIntro";
import { useCreateWorkspaceDialog } from "@/hooks/use-create-workspace-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { CreateWorkspaceRequest } from "@/lib/create-workspace-request";

interface CreateWorkspaceDialogProps {
  projectPath: string;
  gitBranches: string[];
  isLoadingBranches?: boolean;
  isCreatingWorkspace?: boolean;
  onCreateWorkspace: (request: CreateWorkspaceRequest) => Promise<boolean>;
  onLoadBranches?: () => void | Promise<void>;
}

export const CreateWorkspaceDialog = ({
  projectPath,
  gitBranches,
  isLoadingBranches = false,
  isCreatingWorkspace = false,
  onCreateWorkspace,
  onLoadBranches,
}: CreateWorkspaceDialogProps) => {
  const {
    baseBranchInput,
    baseBranches,
    branchInput,
    handleBaseBranchInputChange,
    handleCreateFromExisting,
    handleCreateFromNew,
    handleOpenChange,
    isLoadingBaseBranches,
    isOpen,
    pendingNewBranch,
    selectedBaseBranch,
    setBaseBranchInput,
    setBranchInput,
    setPendingNewBranch,
    setSelectedBaseBranch,
    setStep,
    step,
  } = useCreateWorkspaceDialog({
    projectPath,
    isCreatingWorkspace,
    onCreateWorkspace,
    onLoadBranches,
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2" disabled={isCreatingWorkspace}>
          <GitBranch className="h-4 w-4" />
          New Workspace
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-2xl"
        onEscapeKeyDown={(event) => isCreatingWorkspace && event.preventDefault()}
        onPointerDownOutside={(event) => isCreatingWorkspace && event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Create New Workspace</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <CreateWorkspaceDialogIntro />
          {step === "branch" ? (
            <CreateWorkspaceBranchStep
              branchInput={branchInput}
              gitBranches={gitBranches}
              isCreatingWorkspace={isCreatingWorkspace}
              isLoadingBranches={isLoadingBranches}
              onBranchInputChange={setBranchInput}
              onChooseBaseBranch={setPendingNewBranch}
              onSelectBranch={(branch) => void handleCreateFromExisting(branch)}
            />
          ) : (
            <CreateWorkspaceBaseBranchStep
              baseBranchInput={baseBranchInput}
              baseBranches={baseBranches}
              branchName={pendingNewBranch}
              isCreatingWorkspace={isCreatingWorkspace}
              isLoadingBaseBranches={isLoadingBaseBranches}
              selectedBaseBranch={selectedBaseBranch}
              onBack={() => {
                setBaseBranchInput("");
                setSelectedBaseBranch("");
                setStep("branch");
              }}
              onBaseBranchInputChange={handleBaseBranchInputChange}
              onCreateWorkspace={() => void handleCreateFromNew()}
              onSelectBaseBranch={setSelectedBaseBranch}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
