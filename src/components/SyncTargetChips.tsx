import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SyncTarget, SyncTargetKind } from "@/types/sync-target";

interface SyncTargetChipsProps {
  syncTargets: SyncTarget[];
  onRemoveSyncTarget: (target: SyncTarget) => void;
}

const targetLabelMap: Record<SyncTargetKind, string> = {
  file: "File",
  directory: "Folder",
};

export const SyncTargetChips = ({
  syncTargets,
  onRemoveSyncTarget,
}: SyncTargetChipsProps) => {
  if (syncTargets.length === 0) {
    return (
      <p className="pt-1 text-xs text-muted-foreground">
        No files or folders selected yet. Useful for .env, config folders, and local settings files.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {syncTargets.map((target) => (
        <div
          key={`${target.kind}:${target.path}`}
          className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2 py-1"
        >
          <Badge variant="outline" className="px-1.5 py-0 text-[10px] uppercase">
            {targetLabelMap[target.kind]}
          </Badge>
          <code className="text-xs">{target.path}</code>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-muted-foreground hover:text-foreground"
            onClick={() => onRemoveSyncTarget(target)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
};
