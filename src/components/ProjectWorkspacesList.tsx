import { ProjectWorkspaceRow } from "@/components/ProjectWorkspaceRow";
import type { Environment, EnvironmentBinding } from "@/types/environment";
import type { Workspace } from "@/types/workspace";

interface ProjectWorkspacesListProps {
  environments: Environment[];
  getEnvironmentIdForTarget: (targetPath: string) => string | null;
  isProjectServicesActiveForWorkspace: (workspacePath: string) => boolean;
  onDeleteWorkspace: (workspacePath: string, branch: string) => void;
  onEnvironmentChange: (environmentId: string | null, binding: EnvironmentBinding) => void;
  onOpenInEditor: (path: string) => void;
  projectId: string;
  projectName: string;
  projectPath: string;
  workspaces: Workspace[];
}

export function ProjectWorkspacesList({
  environments,
  getEnvironmentIdForTarget,
  isProjectServicesActiveForWorkspace,
  onDeleteWorkspace,
  onEnvironmentChange,
  onOpenInEditor,
  projectId,
  projectName,
  projectPath,
  workspaces,
}: ProjectWorkspacesListProps) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-card">
      <ProjectWorkspaceRow
        environments={environments}
        localEnvironmentId={getEnvironmentIdForTarget(projectPath)}
        isProjectServicesActive={isProjectServicesActiveForWorkspace(projectPath)}
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
        <ProjectWorkspaceRow
          key={workspace.workspace}
          environments={environments}
          localEnvironmentId={getEnvironmentIdForTarget(workspace.workspace)}
          isProjectServicesActive={isProjectServicesActiveForWorkspace(workspace.workspace)}
          onDeleteWorkspace={() => onDeleteWorkspace(workspace.workspace, workspace.name)}
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
}
