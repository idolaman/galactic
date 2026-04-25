import { useMemo, useState } from "react";
import { GitMerge, Settings2 } from "lucide-react";
import { CreateWorkspaceDialog } from "@/components/CreateWorkspaceDialog";
import { ProjectWorkspacesGrid } from "@/components/ProjectWorkspacesGrid";
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
  const { workspaceIsolationStacks, workspaceIsolationTopologyForProject } =
    useWorkspaceIsolationManager();
  const projectTopology = workspaceIsolationTopologyForProject(projectId);
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
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <GitMerge className="h-6 w-6 text-primary" />
          Workspaces
        </h2>

        <div className="flex items-center gap-2">
          {isGitRepo ? (
            <Button
              variant="outline"
              onClick={() => setIsProjectIsolationDialogOpen(true)}
              className="gap-2"
            >
              <Settings2 className="h-4 w-4" />
              {getWorkspaceIsolationProjectScopeLabel(
                projectTopology?.services.length ?? null,
              )}
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

      <ProjectWorkspacesGrid
        environments={environments}
        getEnvironmentIdForTarget={getEnvironmentIdForTarget}
        isGitRepo={isGitRepo}
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
