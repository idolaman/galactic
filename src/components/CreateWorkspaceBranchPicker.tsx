import { Loader2 } from "lucide-react";
import { BranchSearchHint } from "@/components/BranchSearchHint";
import { CreateWorkspaceCreateBranchItem } from "@/components/CreateWorkspaceCreateBranchItem";
import { CreateWorkspaceExistingBranchItem } from "@/components/CreateWorkspaceExistingBranchItem";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import {
  shouldHideBranchSearchOnBlur,
  shouldShowBranchSearchResults,
} from "@/lib/branch-search-focus";
import { cn } from "@/lib/utils";
import { validateNewBranchName } from "@/lib/create-workspace-request";

interface CreateWorkspaceBranchPickerProps {
  branchInput: string;
  branchSearchActive: boolean;
  currentBranchError: string | null;
  currentProjectBranch: string | null;
  gitBranches: string[];
  isCreatingWorkspace: boolean;
  isDialogOpen: boolean;
  isLoadingBranches: boolean;
  isLoadingCurrentBranch: boolean;
  onBranchInputChange: (value: string) => void;
  onBranchSearchActiveChange: (value: boolean) => void;
  onLoadBranches: () => void;
  onSelectBranch: (branch: string) => void;
  onCreateNewBranch: (branch: string, startPoint: string) => void;
}

export const CreateWorkspaceBranchPicker = ({
  branchInput,
  branchSearchActive,
  currentBranchError,
  currentProjectBranch,
  gitBranches,
  isCreatingWorkspace,
  isDialogOpen,
  isLoadingBranches,
  isLoadingCurrentBranch,
  onBranchInputChange,
  onBranchSearchActiveChange,
  onLoadBranches,
  onSelectBranch,
  onCreateNewBranch,
}: CreateWorkspaceBranchPickerProps) => {
  const newBranchValidation = validateNewBranchName(branchInput, gitBranches);
  const isDuplicate = newBranchValidation.error === "Branch already exists.";
  const showNewBranchError =
    branchInput.trim() !== "" && !newBranchValidation.isValid && !isDuplicate;
  const canCreateFromCurrentBranch =
    newBranchValidation.isValid && !isLoadingCurrentBranch && Boolean(currentProjectBranch);
  const missingStartPointMessage =
    branchInput.trim() !== "" && !isLoadingCurrentBranch && !currentProjectBranch
      ? currentBranchError ?? "Checkout a branch in repository root before creating a new branch."
      : null;

  return (
    <div className="space-y-2">
      <Command className="rounded-lg border border-border bg-background">
        <CommandInput
          placeholder="Search or create a branch..."
          value={branchInput}
          disabled={isCreatingWorkspace}
          onValueChange={onBranchInputChange}
          onFocus={() => {
            if (isCreatingWorkspace) {
              return;
            }
            onBranchSearchActiveChange(true);
            onLoadBranches();
          }}
          onBlur={() => {
            setTimeout(() => {
              if (shouldHideBranchSearchOnBlur({ isDialogOpen })) {
                onBranchSearchActiveChange(false);
              }
            }, 120);
          }}
        />
        <CommandList className="h-[250px] max-h-[250px] overflow-y-auto">
          {isLoadingBranches ? (
            <div className="flex h-[250px] w-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Fetching branches...
            </div>
          ) : (
            <>
              <CommandEmpty>
                {branchInput.trim() === ""
                  ? "No matching branches."
                  : missingStartPointMessage
                    ? missingStartPointMessage
                  : showNewBranchError
                    ? newBranchValidation.error
                    : "No matching branches."}
              </CommandEmpty>

              {canCreateFromCurrentBranch && currentProjectBranch && (
                <CommandGroup heading="Create new branch">
                  <CreateWorkspaceCreateBranchItem
                    branchName={newBranchValidation.normalizedBranch}
                    currentProjectBranch={currentProjectBranch}
                    isCreatingWorkspace={isCreatingWorkspace}
                    onCreateNewBranch={onCreateNewBranch}
                  />
                </CommandGroup>
              )}

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
