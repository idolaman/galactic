import { useState } from "react";
import { useAppToast } from "@/hooks/use-app-toast";
import { useWorkspaceIsolationManager } from "@/hooks/use-workspace-isolation-manager";
import { useWorkspaceIsolationReloadToast } from "@/hooks/use-workspace-isolation-reload-toast";
import {
  trackWorkspaceIsolationActivationCompleted,
  trackWorkspaceIsolationAutoEnvEnableAttempted,
  trackWorkspaceIsolationAutoEnvEnableCompleted,
  trackWorkspaceIsolationDeactivationCompleted,
} from "@/services/workspace-isolation-analytics";
import type { WorkspaceActivationTargetKind } from "@/types/workspace-isolation";

interface UseWorkspaceNetworkingActionsParams {
  projectId: string;
  projectName: string;
  targetKind: WorkspaceActivationTargetKind;
  workspaceLabel: string;
  workspacePath: string;
}

export const useWorkspaceNetworkingActions = ({
  projectId,
  projectName,
  targetKind,
  workspaceLabel,
  workspacePath,
}: UseWorkspaceNetworkingActionsParams) => {
  const { error } = useAppToast();
  const { showAutoEnvEnabledToast } = useWorkspaceIsolationReloadToast();
  const {
    setShellHooksEnabled,
    enableWorkspaceIsolationForWorkspace,
    disableWorkspaceIsolationForWorkspace,
  } = useWorkspaceIsolationManager();
  const [isEnablingAutoEnv, setIsEnablingAutoEnv] = useState(false);
  const [isChangingWorkspaceIsolation, setIsChangingWorkspaceIsolation] = useState(false);

  const handleEnableTerminalIntegration = async () => {
    trackWorkspaceIsolationAutoEnvEnableAttempted("workspace-warning");
    setIsEnablingAutoEnv(true);
    try {
      const result = await setShellHooksEnabled(true);
      trackWorkspaceIsolationAutoEnvEnableCompleted("workspace-warning", result.success);
      if (result.success) {
        showAutoEnvEnabledToast();
        return;
      }
      error({
        title: "Setup failed",
        description: result.error ?? "Unable to update Terminal Auto-Env.",
      });
    } finally {
      setIsEnablingAutoEnv(false);
    }
  };

  const handleEnableWorkspaceIsolation = async () => {
    setIsChangingWorkspaceIsolation(true);
    try {
      const result = await enableWorkspaceIsolationForWorkspace({
        projectId,
        projectName,
        workspaceRootPath: workspacePath,
        workspaceRootLabel: workspaceLabel,
      });
      trackWorkspaceIsolationActivationCompleted({
        source: "workspace-card",
        targetKind,
        isFirstTimeSetup: false,
        success: result.success,
      });
      if (!result.success) {
        error({
          title: "Activation failed",
          description: result.error ?? `Couldn’t activate Project Services for ${workspaceLabel}.`,
        });
      }
    } finally {
      setIsChangingWorkspaceIsolation(false);
    }
  };

  const handleDisableWorkspaceIsolation = async () => {
    setIsChangingWorkspaceIsolation(true);
    try {
      const result = await disableWorkspaceIsolationForWorkspace(workspacePath);
      trackWorkspaceIsolationDeactivationCompleted({
        source: "workspace-card",
        targetKind,
        success: result.success,
      });
      if (!result.success) {
        error({
          title: "Stop failed",
          description: result.error ?? `Couldn’t stop Project Services for ${workspaceLabel}.`,
        });
      }
    } finally {
      setIsChangingWorkspaceIsolation(false);
    }
  };

  return {
    isChangingWorkspaceIsolation,
    isEnablingAutoEnv,
    handleDisableWorkspaceIsolation,
    handleEnableTerminalIntegration,
    handleEnableWorkspaceIsolation,
  };
};
