import { Check, GitBranch } from "lucide-react";
import { CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface CreateWorkspaceExistingBranchItemProps {
  branchName: string;
  isCreatingWorkspace: boolean;
  isSelected?: boolean;
  onSelectBranch: (branch: string) => void;
}

export const CreateWorkspaceExistingBranchItem = ({
  branchName,
  isCreatingWorkspace,
  isSelected = false,
  onSelectBranch,
}: CreateWorkspaceExistingBranchItemProps) => {
  return (
    <CommandItem
      value={branchName}
      onSelect={() => {
        if (!isCreatingWorkspace) {
          onSelectBranch(branchName);
        }
      }}
      className={cn(
        "group flex items-center gap-3 px-2 py-2.5",
        isCreatingWorkspace ? "pointer-events-none opacity-60" : "cursor-pointer",
        isSelected && "bg-primary/10 text-accent-foreground",
      )}
    >
      <div
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-muted bg-background transition-colors group-data-[selected=true]:border-primary/30 group-data-[selected=true]:bg-primary/10",
          isSelected && "border-primary/30 bg-primary/10",
        )}
      >
        {isSelected ? (
          <Check className="h-3.5 w-3.5 text-primary" />
        ) : (
          <GitBranch className="h-3.5 w-3.5 text-muted-foreground transition-colors group-data-[selected=true]:text-primary" />
        )}
      </div>
      <div className="grid min-w-0 flex-1">
        <p className="truncate font-mono text-sm group-data-[selected=true]:text-accent-foreground" title={branchName}>
          {branchName}
        </p>
      </div>
    </CommandItem>
  );
};
