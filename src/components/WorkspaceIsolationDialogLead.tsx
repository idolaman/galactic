import { Badge } from "@/components/ui/badge";
import { WorkspaceIsolationModeField } from "@/components/WorkspaceIsolationModeField";
import type { WorkspaceIsolationDialogStep } from "@/lib/workspace-isolation-dialog-step";
import type { WorkspaceIsolationMode } from "@/types/workspace-isolation";

interface WorkspaceIsolationDialogLeadProps {
  step: WorkspaceIsolationDialogStep;
  workspaceRootPath: string;
  workspaceRootLabel: string;
  workspaceMode: WorkspaceIsolationMode;
  onWorkspaceModeChange: (value: WorkspaceIsolationMode) => void;
}

export const WorkspaceIsolationDialogLead = ({
  step,
  workspaceRootPath,
  workspaceRootLabel,
  workspaceMode,
  onWorkspaceModeChange,
}: WorkspaceIsolationDialogLeadProps) => (
  <>
    <div className="flex w-full min-w-0 items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-3 sm:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Badge variant="secondary" className="flex shrink-0 min-w-0 max-w-[140px] items-center sm:max-w-[240px]">
          <span className="truncate">{workspaceRootLabel}</span>
        </Badge>
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
          {workspaceRootPath}
        </span>
      </div>
      <span className="shrink-0 text-[11px] font-medium text-muted-foreground sm:text-xs">Workspace Root</span>
    </div>

    {step === 3 ? (
      <WorkspaceIsolationModeField
        value={workspaceMode}
        onChange={onWorkspaceModeChange}
      />
    ) : null}
  </>
);
