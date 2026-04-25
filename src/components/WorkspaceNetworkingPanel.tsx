import { WorkspaceIsolationServices } from "@/components/WorkspaceIsolationServices";
import { WorkspaceLegacyEnvironmentCard } from "@/components/WorkspaceLegacyEnvironmentCard";
import { WorkspaceNetworkingStateCard } from "@/components/WorkspaceNetworkingStateCard";
import { useWorkspaceNetworkingActions } from "@/hooks/use-workspace-networking-actions";
import { useWorkspaceNetworkingAnalytics } from "@/hooks/use-workspace-networking-analytics";
import { useWorkspaceNetworkingPanel } from "@/hooks/use-workspace-networking-panel";
import type { Environment } from "@/types/environment";
import type { WorkspaceActivationTargetKind } from "@/types/workspace-isolation";

interface WorkspaceNetworkingPanelProps {
  projectId: string;
  projectName: string;
  workspacePath: string;
  workspaceLabel: string;
  targetKind: WorkspaceActivationTargetKind;
  environments: Environment[];
  localEnvironmentId: string | null;
  onLocalEnvironmentChange: (environmentId: string | null) => void;
}

export const WorkspaceNetworkingPanel = ({
  projectId,
  projectName,
  workspacePath,
  workspaceLabel,
  targetKind,
  environments,
  localEnvironmentId,
  onLocalEnvironmentChange,
}: WorkspaceNetworkingPanelProps) => {
  const state = useWorkspaceNetworkingPanel({ projectId, workspacePath });
  const actions = useWorkspaceNetworkingActions({
    projectId,
    projectName,
    targetKind,
    workspaceLabel,
    workspacePath,
  });

  useWorkspaceNetworkingAnalytics({
    isServicesOpen: state.isServicesOpen,
    status: state.status,
    targetKind,
    workspacePath,
  });

  return (
    <div className="space-y-4 pt-1">
      {state.status ? (
        <WorkspaceNetworkingStateCard
          disabled={
            actions.isChangingWorkspaceIsolation ||
            (!state.realStack && state.status.state === "blocked")
          }
          isWorkspaceActive={Boolean(state.realStack)}
          onPrimaryAction={
            state.realStack
              ? actions.handleDisableWorkspaceIsolation
              : actions.handleEnableWorkspaceIsolation
          }
          status={state.status}
          isSupportActionDisabled={actions.isEnablingAutoEnv}
          onEnableAutoEnv={actions.handleEnableTerminalIntegration}
          onOpenProof={() => state.setIsServicesOpen(true)}
          onRefreshSupport={() => void state.refreshProxyStatus()}
        />
      ) : null}

      {state.realStack ? (
        <WorkspaceIsolationServices
          stack={state.realStack}
          open={state.isServicesOpen}
          onOpenChange={state.setIsServicesOpen}
        />
      ) : null}

      <WorkspaceLegacyEnvironmentCard
        environments={environments}
        localEnvironmentId={localEnvironmentId}
        targetKind={targetKind}
        workspaceLabel={workspaceLabel}
        onLocalEnvironmentChange={onLocalEnvironmentChange}
      />
    </div>
  );
};
