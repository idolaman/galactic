import { ArrowLeft, GitBranch, Loader2 } from "lucide-react";
import { CreateWorkspaceBaseBranchCombobox } from "@/components/CreateWorkspaceBaseBranchCombobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  canCreateWorkspaceFromNewBranch,
  normalizeBaseBranch,
} from "@/lib/create-workspace-flow";

interface CreateWorkspaceBaseBranchStepProps {
  baseBranchInput: string;
  baseBranches: string[];
  branchName: string;
  isCreatingWorkspace: boolean;
  isLoadingBaseBranches: boolean;
  selectedBaseBranch: string;
  onBack: () => void;
  onBaseBranchInputChange: (value: string) => void;
  onCreateWorkspace: () => void;
  onSelectBaseBranch: (branch: string) => void;
}

export const CreateWorkspaceBaseBranchStep = ({
  baseBranchInput,
  baseBranches,
  branchName,
  isCreatingWorkspace,
  isLoadingBaseBranches,
  selectedBaseBranch,
  onBack,
  onBaseBranchInputChange,
  onCreateWorkspace,
  onSelectBaseBranch,
}: CreateWorkspaceBaseBranchStepProps) => {
  const normalizedBaseBranch = normalizeBaseBranch(selectedBaseBranch);
  const canCreateWorkspace = canCreateWorkspaceFromNewBranch(
    normalizedBaseBranch,
    isCreatingWorkspace,
  );

  return (
    <div className="flex h-[325px] flex-col pt-2">
      <div className="mb-6 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-full text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          disabled={isCreatingWorkspace}
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 space-y-0.5">
          <h3 className="truncate text-base font-semibold tracking-tight">
            Configure New Branch
          </h3>
          <p className="text-xs text-muted-foreground truncate">
            Setup the details for your new workspace branch.
          </p>
        </div>
      </div>

      <div className="shrink-0 space-y-4 rounded-xl border border-border/40 bg-muted/10 p-4">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Branch Name
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

      <div className="mt-auto shrink-0 pt-2">
        <Button
          className="group relative w-full overflow-hidden shadow-sm"
          size="lg"
          disabled={!canCreateWorkspace}
          onClick={onCreateWorkspace}
        >
          {isCreatingWorkspace ? (
            <span className="relative z-10 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating Workspace...
            </span>
          ) : (
            <span className="relative z-10 flex items-center gap-2 transition-transform group-hover:scale-[1.02]">
              <GitBranch className="h-4 w-4" />
              Create Workspace
            </span>
          )}
          {!isCreatingWorkspace && canCreateWorkspace && (
            <div className="absolute inset-0 h-full w-full bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </Button>
      </div>
    </div>
  );
};
