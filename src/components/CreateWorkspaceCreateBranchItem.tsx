import { GitBranch, Plus } from "lucide-react";
import { CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface CreateWorkspaceCreateBranchItemProps {
  branchName: string;
  currentProjectBranch: string;
  isCreatingWorkspace: boolean;
  onCreateNewBranch: (branch: string, startPoint: string) => void;
}

export const CreateWorkspaceCreateBranchItem = ({
  branchName,
  currentProjectBranch,
  isCreatingWorkspace,
  onCreateNewBranch,
}: CreateWorkspaceCreateBranchItemProps) => {
  return (
    <CommandItem
      value={`_create_${branchName}`}
      onSelect={() => {
        if (!isCreatingWorkspace) {
          onCreateNewBranch(branchName, currentProjectBranch);
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
        <div className="flex min-w-0 items-center gap-2 pr-4">
          <p className="truncate font-medium text-primary shrink-0 max-w-[50%]" title={branchName}>
            Create <span className="font-mono font-bold">"{branchName}"</span>
          </p>
          <div
            className="flex min-w-0 items-center gap-1.5 rounded-md border border-border/40 bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground shadow-sm"
            title={`Branching from ${currentProjectBranch}`}
          >
            <span className="shrink-0 font-medium uppercase tracking-wider opacity-80">From</span>
            <GitBranch className="h-3 w-3 shrink-0 opacity-70" />
            <span className="truncate font-mono font-medium text-foreground/80">
              {currentProjectBranch}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 opacity-60">
        <span className="text-[10px] font-medium uppercase tracking-wider">↵ to create</span>
      </div>
    </CommandItem>
  );
};
