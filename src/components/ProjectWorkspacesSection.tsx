import { useMemo, useState } from "react";
import { GitMerge, Settings2 } from "lucide-react";

import { CreateWorkspaceDialog } from "@/components/CreateWorkspaceDialog";
import { ProjectWorkspacesList } from "@/components/ProjectWorkspacesList";
import { WorkspaceIsolationDialog } from "@/components/WorkspaceIsolationDialog";
import { Button } from "@/components/ui/button";
import { useWorkspaceIsolationManager } from "@/hooks/use-workspace-isolation-manager";
import type { CreateWorkspaceRequest } from "@/lib/create-workspace-request";
import { createWorkspaceActivationTargets } from "@/lib/workspace-isolation-activation";
import { getWorkspaceIsolationProjectScopeLabel } from "@/lib/workspace-isolation";
import type { Environment, EnvironmentBinding } from "@/types/environment";
import type { Workspace } from "@/types/workspace";

interface ProjectWorkspacesSectionProps {
  environments: Environment[];
  getEnvironmentIdForTarget: (targetPath: string) => string | null;
  gitBranches: string[];
  isCreatingWorkspace: boolean;
  isGitRepo: boolean;
  isLoadingBranches?: boolean;
  onCreateWorkspace: (request: CreateWorkspaceRequest) => Promise<boolean>;
  onDeleteWorkspace: (workspacePath: string, branch: string) => void;
  onEnvironmentChange: (environmentId: string | null, binding: EnvironmentBinding) => void;
  onLoadBranches?: () => void | Promise<void>;
  onOpenInEditor: (path: string) => void;
  projectId: string;
  projectName: string;
  projectPath: string;
  workspaces: Workspace[];
}

export const ProjectWorkspacesSection = ({
  environments,
  getEnvironmentIdForTarget,
  gitBranches,
  isCreatingWorkspace,
  isGitRepo,
  isLoadingBranches,
  onCreateWorkspace,
  onDeleteWorkspace,
  onEnvironmentChange,
  onLoadBranches,
  onOpenInEditor,
  projectId,
  projectName,
  projectPath,
  workspaces,
}: ProjectWorkspacesSectionProps) => {
  const [isProjectIsolationDialogOpen, setIsProjectIsolationDialogOpen] = useState(false);
  const {
    workspaceIsolationForWorkspace,
    workspaceIsolationStacks,
    workspaceIsolationTopologyForProject,
  } = useWorkspaceIsolationManager();
  const projectTopology = workspaceIsolationTopologyForProject(projectId);
  const serviceCount = projectTopology?.services.length ?? 0;
  const worktreeLabel = `${workspaces.length} ${workspaces.length === 1 ? "worktree" : "worktrees"}`;
  const serviceLabel = `${serviceCount} ${serviceCount === 1 ? "service" : "services"}`;
  const activationTargets = useMemo(
    () =>
      createWorkspaceActivationTargets({
        workspaceRootPath: projectPath,
        workspaceRootLabel: "Repository Root",
        workspaces,
        workspaceIsolationStacks,
      }),
    [projectPath, workspaces, workspaceIsolationStacks],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground">
            <GitMerge className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold">Workspaces</h2>
            <p className="truncate text-xs text-muted-foreground">
              Repository root, {worktreeLabel}, {serviceLabel}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isGitRepo ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsProjectIsolationDialogOpen(true)}
              className="gap-2"
            >
              <Settings2 className="h-4 w-4" />
              {getWorkspaceIsolationProjectScopeLabel(projectTopology ? serviceCount : null)}
            </Button>
          ) : null}
          {isGitRepo ? (
            <CreateWorkspaceDialog
              projectPath={projectPath}
              gitBranches={gitBranches}
              isLoadingBranches={isLoadingBranches}
              isCreatingWorkspace={isCreatingWorkspace}
              onCreateWorkspace={onCreateWorkspace}
              onLoadBranches={onLoadBranches}
              triggerSize="sm"
            />
          ) : null}
        </div>
      </div>

      <WorkspaceIsolationDialog
        open={isProjectIsolationDialogOpen}
        onOpenChange={setIsProjectIsolationDialogOpen}
        projectId={projectId}
        workspaceRootPath={projectPath}
        workspaceRootLabel="Repository Root"
        projectName={projectName}
        activationTargets={activationTargets}
        stack={projectTopology}
      />

      <ProjectWorkspacesList
        environments={environments}
        getEnvironmentIdForTarget={getEnvironmentIdForTarget}
        isProjectServicesActiveForWorkspace={(workspacePath) =>
          Boolean(workspaceIsolationForWorkspace(workspacePath))
        }
        onDeleteWorkspace={onDeleteWorkspace}
        onEnvironmentChange={onEnvironmentChange}
        onOpenInEditor={onOpenInEditor}
        projectId={projectId}
        projectName={projectName}
        projectPath={projectPath}
        workspaces={workspaces}
      />
    </div>
  );
};
