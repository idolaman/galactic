import { ProjectWorkspaceCard } from "@/components/ProjectWorkspaceCard";
import type { Environment, EnvironmentBinding } from "@/types/environment";
import type { Workspace } from "@/types/workspace";

interface ProjectWorkspacesGridProps {
  environments: Environment[];
  getEnvironmentIdForTarget: (targetPath: string) => string | null;
  isGitRepo: boolean;
  onDeleteWorkspace: (workspacePath: string, branch: string) => void;
  onEnvironmentChange: (environmentId: string | null, binding: EnvironmentBinding) => void;
  onOpenInEditor: (path: string) => void;
  projectId: string;
  projectName: string;
  projectPath: string;
  workspaces: Workspace[];
}

export const ProjectWorkspacesGrid = ({
  environments,
  getEnvironmentIdForTarget,
  isGitRepo,
  onDeleteWorkspace,
  onEnvironmentChange,
  onOpenInEditor,
  projectId,
  projectName,
  projectPath,
  workspaces,
}: ProjectWorkspacesGridProps) => (
  <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
    <ProjectWorkspaceCard
      environments={environments}
      isGitRepo={isGitRepo}
      localEnvironmentId={getEnvironmentIdForTarget(projectPath)}
      onLocalEnvironmentChange={(environmentId) =>
        onEnvironmentChange(environmentId, {
          projectId,
          projectName,
          targetPath: projectPath,
          targetLabel: "Repository Root",
          kind: "base",
        })
      }
      onOpenInEditor={onOpenInEditor}
      projectId={projectId}
      projectName={projectName}
      targetKind="base"
      workspaceLabel="Repository Root"
      workspacePath={projectPath}
    />

    {workspaces.map((workspace) => (
      <ProjectWorkspaceCard
        key={workspace.workspace}
        environments={environments}
        isGitRepo={isGitRepo}
        localEnvironmentId={getEnvironmentIdForTarget(workspace.workspace)}
        onDeleteWorkspace={() =>
          onDeleteWorkspace(workspace.workspace, workspace.name)
        }
        onLocalEnvironmentChange={(environmentId) =>
          onEnvironmentChange(environmentId, {
            projectId,
            projectName,
            targetPath: workspace.workspace,
            targetLabel: workspace.name,
            kind: "workspace",
          })
        }
        onOpenInEditor={onOpenInEditor}
        projectId={projectId}
        projectName={projectName}
        targetKind="workspace"
        workspaceLabel={workspace.name}
        workspacePath={workspace.workspace}
      />
    ))}
  </div>
);
