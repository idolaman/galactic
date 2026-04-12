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
    <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
      <div className="flex items-center gap-3">
        <Badge variant="secondary">{workspaceRootLabel}</Badge>
        <span className="font-mono text-xs text-muted-foreground">
          {workspaceRootPath}
        </span>
      </div>
      <span className="text-xs text-muted-foreground">Workspace Root</span>
    </div>

    {step === 3 ? (
      <WorkspaceIsolationModeField
        value={workspaceMode}
        onChange={onWorkspaceModeChange}
      />
    ) : null}
  </>
);
