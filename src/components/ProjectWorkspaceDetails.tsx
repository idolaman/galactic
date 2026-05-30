import { WorkspaceNetworkingPanel } from "@/components/WorkspaceNetworkingPanel";
import type { Environment } from "@/types/environment";
import type { WorkspaceActivationTargetKind } from "@/types/workspace-isolation";

export interface ProjectWorkspaceDetailsProps {
  environments: Environment[];
  localEnvironmentId: string | null;
  onLocalEnvironmentChange: (environmentId: string | null) => void;
  projectId: string;
  projectName: string;
  targetKind: WorkspaceActivationTargetKind;
  workspaceLabel: string;
  workspacePath: string;
}

export function ProjectWorkspaceDetails({
  environments,
  localEnvironmentId,
  onLocalEnvironmentChange,
  projectId,
  projectName,
  targetKind,
  workspaceLabel,
  workspacePath,
}: ProjectWorkspaceDetailsProps) {
  return (
    <div className="border-t border-border bg-muted/15 px-4 py-3">
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
  );
}
