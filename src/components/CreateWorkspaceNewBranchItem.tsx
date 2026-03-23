import { ArrowRight, Plus } from "lucide-react";
import { CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface CreateWorkspaceNewBranchItemProps {
  branchName: string;
  isCreatingWorkspace: boolean;
  onChooseBaseBranch: (branch: string) => void;
}

export const CreateWorkspaceNewBranchItem = ({
  branchName,
  isCreatingWorkspace,
  onChooseBaseBranch,
}: CreateWorkspaceNewBranchItemProps) => {
  return (
    <CommandItem
      value={`_create_${branchName}`}
      onSelect={() => {
        if (!isCreatingWorkspace) {
          onChooseBaseBranch(branchName);
        }
      }}
      className={cn(
        "group flex items-center gap-3 px-2 py-2.5",
        isCreatingWorkspace ? "pointer-events-none opacity-60" : "cursor-pointer",
      )}
    >
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-primary/10 transition-colors">
        <Plus className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="grid min-w-0 flex-1">
        <p className="truncate font-medium text-primary" title={branchName}>
          Create <span className="font-mono font-bold">"{branchName}"</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Choose the branch this new workspace branch should start from.
        </p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </CommandItem>
  );
};
