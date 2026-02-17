import { useEffect, useRef, useState } from "react";
import { File, Folder, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { includesSyncTarget } from "@/services/sync-targets";
import type { SyncTarget, SyncTargetKind } from "@/types/sync-target";
import { SyncTargetChips } from "@/components/SyncTargetChips";

interface ProjectSyncTargetsProps {
  projectPath: string;
  syncTargets: SyncTarget[];
  searchResults: SyncTarget[];
  isSearching: boolean;
  onSearchTargets: (query: string) => void;
  onAddSyncTarget: (target: SyncTarget) => void;
  onRemoveSyncTarget: (target: SyncTarget) => void;
}

const targetActionMap: Record<SyncTargetKind, string> = {
  file: "Add file",
  directory: "Add folder",
};

export const ProjectSyncTargets = ({
  projectPath,
  syncTargets,
  searchResults,
  isSearching,
  onSearchTargets,
  onAddSyncTarget,
  onRemoveSyncTarget,
}: ProjectSyncTargetsProps) => {
  const [searchInput, setSearchInput] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const queryTooShort = searchInput.trim().length < 2;

  const handleSelectTarget = (target: SyncTarget) => {
    if (includesSyncTarget(syncTargets, target)) {
      return;
    }

    onAddSyncTarget(target);
    setSearchInput("");
    setSearchActive(false);
    inputRef.current?.blur();
  };

  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed.length < 2) {
      onSearchTargets("");
      return;
    }

    const timeout = setTimeout(() => onSearchTargets(trimmed), 250);
    return () => clearTimeout(timeout);
  }, [searchInput, onSearchTargets]);

  useEffect(() => {
    setSearchInput("");
    setSearchActive(false);
  }, [projectPath]);

  return (
    <Card className="space-y-3 border-border bg-card p-4">
      <Command className="rounded-lg border border-border bg-background">
        <CommandInput
          ref={inputRef}
          placeholder="Search files or folders to copy..."
          value={searchInput}
          onValueChange={setSearchInput}
          onFocus={() => setSearchActive(true)}
          onBlur={() => setTimeout(() => setSearchActive(false), 120)}
        />
        <CommandList className={cn("max-h-60", searchActive && !queryTooShort ? "" : "hidden")}>
          <CommandEmpty>
            {isSearching ? (
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching files and folders...
              </span>
            ) : (
              "No matching files or folders"
            )}
          </CommandEmpty>
          <CommandGroup heading="Matching items">
            {searchResults.map((target) => {
              const isAdded = includesSyncTarget(syncTargets, target);
              const Icon = target.kind === "directory" ? Folder : File;
              return (
                <CommandItem
                  key={`${target.kind}:${target.path}`}
                  value={`${target.kind}:${target.path}`}
                  onSelect={() => !isAdded && handleSelectTarget(target)}
                  className={cn("flex items-center justify-between", isAdded && "opacity-50")}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <code className="max-w-[260px] truncate font-mono text-xs">{target.path}</code>
                  </div>
                  {isAdded ? (
                    <Badge variant="secondary" className="text-[11px]">
                      Added
                    </Badge>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">{targetActionMap[target.kind]}</span>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </Command>

      <SyncTargetChips
        syncTargets={syncTargets}
        onRemoveSyncTarget={onRemoveSyncTarget}
      />
    </Card>
  );
};
