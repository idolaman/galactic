import { CreateWorkspaceBaseBranchStep } from "@/components/CreateWorkspaceBaseBranchStep";
import { CreateWorkspaceBranchStep } from "@/components/CreateWorkspaceBranchStep";
import { CreateWorkspaceDialogIntro } from "@/components/CreateWorkspaceDialogIntro";

interface CreateWorkspaceDialogBodyProps {
  baseBranchInput: string;
  baseBranches: string[];
  branchInput: string;
  branchName: string;
  gitBranches: string[];
  isCreatingWorkspace: boolean;
  isLoadingBaseBranches: boolean;
  isLoadingBranches: boolean;
  selectedBaseBranch: string;
  selectedExistingBranch: string;
  step: "branch" | "base";
  onBaseBranchInputChange: (value: string) => void;
  onBranchInputChange: (value: string) => void;
  onChooseBaseBranch: (branch: string) => void;
  onSelectBaseBranch: (branch: string) => void;
  onSelectBranch: (branch: string) => void;
}

export const CreateWorkspaceDialogBody = ({
  baseBranchInput,
  baseBranches,
  branchInput,
  branchName,
  gitBranches,
  isCreatingWorkspace,
  isLoadingBaseBranches,
  isLoadingBranches,
  selectedBaseBranch,
  selectedExistingBranch,
  step,
  onBaseBranchInputChange,
  onBranchInputChange,
  onChooseBaseBranch,
  onSelectBaseBranch,
  onSelectBranch,
}: CreateWorkspaceDialogBodyProps) => (
  <div className="flex min-h-[24rem] flex-col gap-4 px-5 py-4">
    <CreateWorkspaceDialogIntro />
    {step === "branch" ? (
      <CreateWorkspaceBranchStep
        branchInput={branchInput}
        gitBranches={gitBranches}
        isCreatingWorkspace={isCreatingWorkspace}
        isLoadingBranches={isLoadingBranches}
        selectedBranch={selectedExistingBranch}
        onBranchInputChange={onBranchInputChange}
        onChooseBaseBranch={onChooseBaseBranch}
        onSelectBranch={onSelectBranch}
      />
    ) : (
      <CreateWorkspaceBaseBranchStep
        baseBranchInput={baseBranchInput}
        baseBranches={baseBranches}
        branchName={branchName}
        isCreatingWorkspace={isCreatingWorkspace}
        isLoadingBaseBranches={isLoadingBaseBranches}
        selectedBaseBranch={selectedBaseBranch}
        onBaseBranchInputChange={onBaseBranchInputChange}
        onSelectBaseBranch={onSelectBaseBranch}
      />
    )}
  </div>
);
