import { useEffect, useState } from "react";
import { type SaveWorkspaceIsolationInput, type WorkspaceIsolationManagerValue } from "@/hooks/workspace-isolation-manager-context";
import { useWorkspaceIsolationReloadToast } from "@/hooks/use-workspace-isolation-reload-toast";
import { normalizeWorkspaceRootPath } from "@/lib/workspace-isolation-helpers";
import {
  deleteWorkspaceIsolationProjectTopology, disableWorkspaceIsolationForWorkspace, enableWorkspaceIsolationForWorkspace,
  getInitialWorkspaceIsolationIntroSeen, getInitialWorkspaceIsolationProjectTopologies,
  getInitialWorkspaceIsolationShellHookStatus, getInitialWorkspaceIsolationStacks,
  getWorkspaceIsolationProjectTopologies, getWorkspaceIsolationShellHookStatus, getWorkspaceIsolationStacks,
  markWorkspaceIsolationIntroSeen, saveWorkspaceIsolationProjectTopology, setWorkspaceIsolationShellHooksEnabled,
} from "@/services/workspace-isolation";
import type { WorkspaceIsolationShellHookStatus } from "@/types/electron";
import type { WorkspaceIsolationProjectTopology, WorkspaceIsolationStack } from "@/types/workspace-isolation";
export const useWorkspaceIsolationManagerValue = (): WorkspaceIsolationManagerValue => {
  const [workspaceIsolationStacks, setWorkspaceIsolationStacks] =
    useState<WorkspaceIsolationStack[]>(getInitialWorkspaceIsolationStacks);
  const [workspaceIsolationProjectTopologies, setWorkspaceIsolationProjectTopologies] =
    useState<WorkspaceIsolationProjectTopology[]>(getInitialWorkspaceIsolationProjectTopologies);
  const [workspaceIsolationIntroSeen, setWorkspaceIsolationIntroSeen] =
    useState(getInitialWorkspaceIsolationIntroSeen);
  const [shellHookStatus, setShellHookStatus] =
    useState<WorkspaceIsolationShellHookStatus | null>(getInitialWorkspaceIsolationShellHookStatus);
  const { showActivationReloadToast } = useWorkspaceIsolationReloadToast();
  const refreshWorkspaceIsolationState = async () => {
    const [stacks, topologies, hookStatus] = await Promise.all([
      getWorkspaceIsolationStacks(),
      getWorkspaceIsolationProjectTopologies(),
      getWorkspaceIsolationShellHookStatus(),
    ]);
    setWorkspaceIsolationStacks(stacks);
    setWorkspaceIsolationProjectTopologies(topologies);
    setShellHookStatus(hookStatus);
    return { hookStatus };
  };

  useEffect(() => {
    void refreshWorkspaceIsolationState();
  }, []);

  const workspaceIsolationTopologyForProject = (projectId: string) =>
    workspaceIsolationProjectTopologies.find(
      (topology) => topology.projectId === projectId,
    ) ?? null;

  const workspaceIsolationForWorkspace = (workspaceRootPath: string) => {
    const normalizedPath = normalizeWorkspaceRootPath(workspaceRootPath);
    return (
      workspaceIsolationStacks.find(
        (stack) => stack.workspaceRootPath === normalizedPath,
      ) ?? null
    );
  };

  const saveWorkspaceIsolationProjectTopologyValue = async (
    input: SaveWorkspaceIsolationInput,
  ) => {
    const result = await saveWorkspaceIsolationProjectTopology(input);
    if (result.success) {
      await refreshWorkspaceIsolationState();
    }
    return result;
  };

  const deleteWorkspaceIsolationProjectTopologyValue = async (topologyId: string) => {
    const result = await deleteWorkspaceIsolationProjectTopology(topologyId);
    if (result.success) {
      await refreshWorkspaceIsolationState();
    }
    return result;
  };

  const enableWorkspaceIsolationForWorkspaceValue = async (input: {
    projectId: string;
    projectName: string;
    workspaceRootPath: string;
    workspaceRootLabel: string;
  }) => {
    const result = await enableWorkspaceIsolationForWorkspace(input);
    if (result.success) {
      const { hookStatus: nextHookStatus } = await refreshWorkspaceIsolationState();
      if (nextHookStatus?.enabled) {
        showActivationReloadToast(input.workspaceRootLabel);
      }
    }
    return result;
  };

  const disableWorkspaceIsolationForWorkspaceValue = async (
    workspaceRootPath: string,
  ) => {
    const result = await disableWorkspaceIsolationForWorkspace(workspaceRootPath);
    if (result.success) {
      await refreshWorkspaceIsolationState();
    }
    return result;
  };

  const deleteWorkspaceIsolationForProject = async (projectId: string) => {
    const topology = workspaceIsolationTopologyForProject(projectId);
    if (topology) {
      await deleteWorkspaceIsolationProjectTopologyValue(topology.id);
    }
  };

  const setShellHooksEnabled = async (enabled: boolean) => {
    const result = await setWorkspaceIsolationShellHooksEnabled(enabled);
    if (result.success) {
      try {
        setShellHookStatus(await getWorkspaceIsolationShellHookStatus());
      } catch {
        // Keep the previous UI state if the status refresh fails after a successful write.
      }
    }
    return result;
  };

  const markWorkspaceIsolationIntroSeenValue = async () => {
    const result = await markWorkspaceIsolationIntroSeen();
    if (result.success && result.seen) {
      setWorkspaceIsolationIntroSeen(true);
    }
    return result;
  };

  return {
    workspaceIsolationStacks,
    workspaceIsolationProjectTopologies,
    workspaceIsolationIntroSeen,
    shellHookStatus,
    workspaceIsolationTopologyForProject,
    workspaceIsolationForWorkspace,
    saveWorkspaceIsolationProjectTopology: saveWorkspaceIsolationProjectTopologyValue,
    deleteWorkspaceIsolationProjectTopology: deleteWorkspaceIsolationProjectTopologyValue,
    enableWorkspaceIsolationForWorkspace: enableWorkspaceIsolationForWorkspaceValue,
    disableWorkspaceIsolationForWorkspace: disableWorkspaceIsolationForWorkspaceValue,
    deleteWorkspaceIsolationForProject,
    markWorkspaceIsolationIntroSeen: markWorkspaceIsolationIntroSeenValue,
    setShellHooksEnabled,
  };
};
