import { AlertTriangle, FolderOpen, HardDrive, Trash2 } from "lucide-react";
import { LaunchButton } from "@/components/LaunchButton";
import { WorkspaceNetworkingPanel } from "@/components/WorkspaceNetworkingPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Environment } from "@/types/environment";
import type { WorkspaceActivationTargetKind } from "@/types/workspace-isolation";

interface ProjectWorkspaceCardProps {
  environments: Environment[];
  isGitRepo: boolean;
  localEnvironmentId: string | null;
  onDeleteWorkspace?: () => void;
  onLocalEnvironmentChange: (environmentId: string | null) => void;
  onOpenInEditor: (path: string) => void;
  projectId: string;
  projectName: string;
  targetKind: WorkspaceActivationTargetKind;
  workspaceLabel: string;
  workspacePath: string;
}

const cardClassNames = {
  base: "bg-gradient-card border-primary/20 shadow-sm",
  workspace: "bg-card/50 border-primary/20 hover:border-primary/40 transition-colors",
} as const;

export const ProjectWorkspaceCard = ({
  environments,
  isGitRepo,
  localEnvironmentId,
  onDeleteWorkspace,
  onLocalEnvironmentChange,
  onOpenInEditor,
  projectId,
  projectName,
  targetKind,
  workspaceLabel,
  workspacePath,
}: ProjectWorkspaceCardProps) => (
  <Card className={cn("group p-4", cardClassNames[targetKind])}>
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          {targetKind === "base" ? (
            <>
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-primary" />
                <h3 className="text-lg font-semibold text-primary">
                  Repository Root
                </h3>
              </div>
              {!isGitRepo ? (
                <div className="flex items-center gap-2 pt-1 text-xs text-amber-400">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Git not initialized</span>
                </div>
              ) : null}
            </>
          ) : (
            <Badge
              variant="outline"
              className="max-w-full truncate rounded-md border-primary/20 bg-primary/10 px-2.5 py-1 font-mono text-sm text-primary"
              title={workspaceLabel}
            >
              {workspaceLabel}
            </Badge>
          )}
          <div
            className="select-all truncate px-0.5 font-mono text-[10px] text-muted-foreground"
            title={workspacePath}
          >
            {workspacePath}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {onDeleteWorkspace ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground opacity-0 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
              onClick={onDeleteWorkspace}
              title="Delete Workspace"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
          <LaunchButton
            path={workspacePath}
            environmentId={localEnvironmentId}
            onLaunch={onOpenInEditor}
            className="h-9 shrink-0 px-5 text-sm font-medium shadow-sm"
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            Open
          </LaunchButton>
        </div>
      </div>

      <div className="pt-1">
        <WorkspaceNetworkingPanel
          projectId={projectId}
          projectName={projectName}
          workspacePath={workspacePath}
          workspaceLabel={workspaceLabel}
          targetKind={targetKind}
          environments={environments}
          localEnvironmentId={localEnvironmentId}
          onLocalEnvironmentChange={onLocalEnvironmentChange}
        />
      </div>
    </div>
  </Card>
);
