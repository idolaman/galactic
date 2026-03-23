import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ChevronsUpDown, GitBranch, Loader2 } from "lucide-react";
import { CreateWorkspaceExistingBranchItem } from "@/components/CreateWorkspaceExistingBranchItem";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { filterBranchesByQuery, normalizeBaseBranch } from "@/lib/create-workspace-flow";
import { cn } from "@/lib/utils";

interface CreateWorkspaceBaseBranchComboboxProps {
  baseBranchInput: string;
  baseBranches: string[];
  isCreatingWorkspace: boolean;
  isLoadingBaseBranches: boolean;
  selectedBaseBranch: string;
  onBaseBranchInputChange: (value: string) => void;
  onSelectBaseBranch: (branch: string) => void;
}

const BLUR_CLOSE_DELAY_MS = 120;

export const CreateWorkspaceBaseBranchCombobox = ({
  baseBranchInput,
  baseBranches,
  isCreatingWorkspace,
  isLoadingBaseBranches,
  selectedBaseBranch,
  onBaseBranchInputChange,
  onSelectBaseBranch,
}: CreateWorkspaceBaseBranchComboboxProps) => {
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const blurTimeoutRef = useRef<number | null>(null);
  const [isListVisible, setIsListVisible] = useState(false);
  const [overlayWidth, setOverlayWidth] = useState<number | null>(null);
  const normalizedBaseBranch = normalizeBaseBranch(selectedBaseBranch);
  const filteredBaseBranches = filterBranchesByQuery(baseBranches, baseBranchInput);
  const emptyMessage = baseBranches.length === 0 ? "No local branches available." : "No matching base branches.";
  const popoverStyle = overlayWidth === null
    ? undefined
    : ({ "--create-workspace-base-branch-width": `${overlayWidth}px` } as CSSProperties);

  const clearBlurTimeout = () => {
    if (blurTimeoutRef.current !== null) window.clearTimeout(blurTimeoutRef.current);
    blurTimeoutRef.current = null;
  };

  useEffect(() => () => clearBlurTimeout(), []);

  const hideList = () => {
    clearBlurTimeout();
    setIsListVisible(false);
  };

  const showList = () => {
    clearBlurTimeout();
    setOverlayWidth(anchorRef.current?.offsetWidth ?? null);
    setIsListVisible(true);
  };

  return (
    <div className="space-y-2">
      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Base Branch</Label>
      <Popover open={isListVisible} onOpenChange={(open) => { clearBlurTimeout(); setIsListVisible(open); }}>
        <Command shouldFilter={false} className="rounded-lg border border-border/60 bg-background shadow-sm">
          <PopoverAnchor asChild>
            <div ref={anchorRef} className="relative">
              <GitBranch className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <CommandInput
                hideIcon
                placeholder="Select a local branch..."
                value={baseBranchInput}
                disabled={isCreatingWorkspace || isLoadingBaseBranches}
                wrapperClassName="rounded-lg border-b-0 px-0"
                className={cn("h-10 pl-9 pr-10 font-mono text-sm", !normalizedBaseBranch && !baseBranchInput && "text-muted-foreground")}
                onValueChange={(value) => {
                  showList();
                  onBaseBranchInputChange(value);
                }}
                onFocus={showList}
                onBlur={() => {
                  clearBlurTimeout();
                  blurTimeoutRef.current = window.setTimeout(hideList, BLUR_CLOSE_DELAY_MS);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    hideList();
                    event.currentTarget.blur();
                  }
                }}
              />
              {isLoadingBaseBranches ? (
                <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              ) : (
                <ChevronsUpDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
              )}
            </div>
          </PopoverAnchor>
          <PopoverContent
            align="start"
            sideOffset={8}
            style={popoverStyle}
            className="z-[60] w-[var(--create-workspace-base-branch-width)] border-border/60 p-0 shadow-lg"
            onOpenAutoFocus={(event) => event.preventDefault()}
            onCloseAutoFocus={(event) => event.preventDefault()}
            onInteractOutside={(event) => {
              if (anchorRef.current?.contains(event.target as Node)) event.preventDefault();
            }}
          >
            <CommandList className="max-h-[160px]">
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {filteredBaseBranches.map((branch) => (
                  <CreateWorkspaceExistingBranchItem
                    key={branch}
                    branchName={branch}
                    isCreatingWorkspace={isCreatingWorkspace}
                    isSelected={normalizedBaseBranch === branch}
                    onSelectBranch={(selected) => {
                      onSelectBaseBranch(selected);
                      hideList();
                    }}
                  />
                ))}
              </CommandGroup>
            </CommandList>
          </PopoverContent>
        </Command>
      </Popover>
      <p className="px-0.5 pt-1 text-xs text-muted-foreground">
        The new branch will be created extending from this local base branch.
      </p>
    </div>
  );
};
