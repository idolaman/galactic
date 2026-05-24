import { GitBranch } from "lucide-react";
import { CreateWorkspaceBaseBranchCombobox } from "@/components/CreateWorkspaceBaseBranchCombobox";
import { Input } from "@/components/ui/input";

interface CreateWorkspaceBaseBranchStepProps {
  baseBranchInput: string;
  baseBranches: string[];
  branchName: string;
  isCreatingWorkspace: boolean;
  isLoadingBaseBranches: boolean;
  selectedBaseBranch: string;
  onBaseBranchInputChange: (value: string) => void;
  onSelectBaseBranch: (branch: string) => void;
}

export const CreateWorkspaceBaseBranchStep = ({
  baseBranchInput,
  baseBranches,
  branchName,
  isCreatingWorkspace,
  isLoadingBaseBranches,
  selectedBaseBranch,
  onBaseBranchInputChange,
  onSelectBaseBranch,
}: CreateWorkspaceBaseBranchStepProps) => {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="min-w-0 space-y-1">
        <h3 className="truncate text-sm font-semibold tracking-tight">
          Configure new branch
        </h3>
        <p className="truncate text-xs text-muted-foreground">
          Confirm which local branch the new workspace branch starts from.
        </p>
      </div>

      <div className="shrink-0 space-y-4 rounded-lg border bg-card p-4">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            New branch
          </p>
          <div className="relative">
            <GitBranch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={branchName}
              readOnly
              disabled
              className="border-border/60 bg-background/50 pl-9 font-mono text-sm shadow-sm"
            />
          </div>
        </div>
        <CreateWorkspaceBaseBranchCombobox
          baseBranchInput={baseBranchInput}
          baseBranches={baseBranches}
          isCreatingWorkspace={isCreatingWorkspace}
          isLoadingBaseBranches={isLoadingBaseBranches}
          selectedBaseBranch={selectedBaseBranch}
          onBaseBranchInputChange={onBaseBranchInputChange}
          onSelectBaseBranch={onSelectBaseBranch}
        />
      </div>
    </div>
  );
};
