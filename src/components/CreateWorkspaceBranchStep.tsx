import { Loader2 } from "lucide-react";
import { BranchSearchHint } from "@/components/BranchSearchHint";
import { CreateWorkspaceExistingBranchItem } from "@/components/CreateWorkspaceExistingBranchItem";
import { CreateWorkspaceNewBranchItem } from "@/components/CreateWorkspaceNewBranchItem";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import { resolveBranchSelection } from "@/lib/create-workspace-flow";

interface CreateWorkspaceBranchStepProps {
  branchInput: string;
  gitBranches: string[];
  isCreatingWorkspace: boolean;
  isLoadingBranches: boolean;
  onBranchInputChange: (value: string) => void;
  onChooseBaseBranch: (branch: string) => void;
  onSelectBranch: (branch: string) => void;
}

export const CreateWorkspaceBranchStep = ({
  branchInput,
  gitBranches,
  isCreatingWorkspace,
  isLoadingBranches,
  onBranchInputChange,
  onChooseBaseBranch,
  onSelectBranch,
}: CreateWorkspaceBranchStepProps) => {
  const branchSelection = resolveBranchSelection(branchInput, gitBranches);
  const emptyMessage =
    branchSelection.kind === "invalid"
      ? branchSelection.error
      : "No matching branches.";

  return (
    <div className="space-y-2">
      <Command className="rounded-lg border border-border bg-background">
        <CommandInput
          placeholder="Search or create a branch..."
          value={branchInput}
          disabled={isCreatingWorkspace}
          onValueChange={onBranchInputChange}
        />
        <CommandList className="h-[250px] max-h-[250px] overflow-y-auto">
          {isLoadingBranches ? (
            <div className="flex h-[250px] w-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Fetching branches...
            </div>
          ) : (
            <>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              {branchSelection.kind === "new" ? (
                <CommandGroup heading="Create new branch">
                  <CreateWorkspaceNewBranchItem
                    branchName={branchSelection.branch}
                    isCreatingWorkspace={isCreatingWorkspace}
                    onChooseBaseBranch={onChooseBaseBranch}
                  />
                </CommandGroup>
              ) : null}
              <CommandGroup heading="Available branches">
                {gitBranches.map((branchName) => (
                  <CreateWorkspaceExistingBranchItem
                    key={branchName}
                    branchName={branchName}
                    isCreatingWorkspace={isCreatingWorkspace}
                    onSelectBranch={onSelectBranch}
                  />
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
      <BranchSearchHint />
    </div>
  );
};
