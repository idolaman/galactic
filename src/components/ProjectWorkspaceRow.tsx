import { type MouseEvent, useState } from "react";
import { CheckCircle2, ChevronDown, FolderOpen, GitBranch, HardDrive, SquareTerminal, Trash2 } from "lucide-react";

import { LaunchButton } from "@/components/LaunchButton";
import { ProjectWorkspaceDetails } from "@/components/ProjectWorkspaceDetails";
import { WorkspaceRelaunchIndicator } from "@/components/WorkspaceRelaunchIndicator";
import { useWorkspaceConsole } from "@/components/WorkspaceConsole/WorkspaceConsoleContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Environment } from "@/types/environment";
import type { WorkspaceActivationTargetKind } from "@/types/workspace-isolation";

export interface ProjectWorkspaceRowProps {
  environments: Environment[];
  localEnvironmentId: string | null;
  isProjectServicesActive: boolean;
  onDeleteWorkspace?: () => void;
  onLocalEnvironmentChange: (environmentId: string | null) => void;
  onOpenInEditor: (path: string) => void;
  projectId: string;
  projectName: string;
  targetKind: WorkspaceActivationTargetKind;
  workspaceLabel: string;
  workspacePath: string;
}

export function ProjectWorkspaceRow({
  environments,
  localEnvironmentId,
  isProjectServicesActive,
  onDeleteWorkspace,
  onLocalEnvironmentChange,
  onOpenInEditor,
  projectId,
  projectName,
  targetKind,
  workspaceLabel,
  workspacePath,
}: ProjectWorkspaceRowProps) {
  const [open, setOpen] = useState(false);
  const { openConsoleForWorkspace } = useWorkspaceConsole();
  const Icon = targetKind === "base" ? HardDrive : GitBranch;
  const handleOpenConsole = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    void openConsoleForWorkspace({ targetKind, workspaceLabel, workspacePath });
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="group border-b border-border last:border-b-0">
        <div className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 hover:bg-muted/35">
          <div className="flex min-w-0 items-center gap-3">
            <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background", targetKind === "base" ? "text-primary" : "text-muted-foreground")}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex min-w-0 items-center gap-2">
                <h3 className="truncate text-sm font-semibold">{workspaceLabel}</h3>
              </div>
              <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                <code className="truncate" title={workspacePath}>{workspacePath}</code>
                <WorkspaceRelaunchIndicator path={workspacePath} showLabel className="shrink-0" />
                {isProjectServicesActive ? (
                  <Badge variant="outline" className="h-5 shrink-0 gap-1 border-emerald-500/30 bg-emerald-500/10 px-1.5 text-[10px] text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" />
                    Services active
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid shrink-0 grid-cols-[2rem_2rem_auto_2rem] items-center gap-2">
            {onDeleteWorkspace ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete workspace"
                className="h-8 w-8 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 group-focus-within:opacity-100"
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteWorkspace();
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : (
              <span className="h-8 w-8" aria-hidden="true" />
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Open workspace console"
                  className="h-9 w-9 shrink-0"
                  onClick={handleOpenConsole}
                >
                  <SquareTerminal className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open console</TooltipContent>
            </Tooltip>
            <LaunchButton path={workspacePath} environmentId={localEnvironmentId} onLaunch={onOpenInEditor} size="sm">
              <FolderOpen className="mr-2 h-4 w-4" />
              Open
            </LaunchButton>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Toggle workspace details">
                <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>
        <CollapsibleContent>
          <ProjectWorkspaceDetails
            environments={environments}
            localEnvironmentId={localEnvironmentId}
            onLocalEnvironmentChange={onLocalEnvironmentChange}
            projectId={projectId}
            projectName={projectName}
            targetKind={targetKind}
            workspaceLabel={workspaceLabel}
            workspacePath={workspacePath}
          />
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
