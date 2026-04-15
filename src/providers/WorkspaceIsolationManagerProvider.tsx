import { useEffect, useState, type ReactNode } from "react";
import {
  WorkspaceIsolationManagerContext,
  type SaveWorkspaceIsolationInput,
  type WorkspaceIsolationManagerValue,
} from "@/hooks/workspace-isolation-manager-context";
import { normalizeWorkspaceRootPath } from "@/lib/workspace-isolation-helpers";
import {
  deleteWorkspaceIsolationProjectTopology,
  disableWorkspaceIsolationForWorkspace,
  enableWorkspaceIsolationForWorkspace,
  getInitialWorkspaceIsolationIntroSeen,
  getInitialWorkspaceIsolationProjectTopologies,
  getInitialWorkspaceIsolationShellHookStatus,
  getInitialWorkspaceIsolationStacks,
  getWorkspaceIsolationProjectTopologies,
  getWorkspaceIsolationStacks,
  markWorkspaceIsolationIntroSeen,
  saveWorkspaceIsolationProjectTopology,
  getWorkspaceIsolationShellHookStatus,
  setWorkspaceIsolationShellHooksEnabled,
} from "@/services/workspace-isolation";
import type {
  WorkspaceIsolationProjectTopology,
  WorkspaceIsolationStack,
} from "@/types/workspace-isolation";
import type { WorkspaceIsolationShellHookStatus } from "@/types/electron";

export const WorkspaceIsolationManagerProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [workspaceIsolationStacks, setWorkspaceIsolationStacks] =
    useState<WorkspaceIsolationStack[]>(getInitialWorkspaceIsolationStacks);
  const [workspaceIsolationProjectTopologies, setWorkspaceIsolationProjectTopologies] =
    useState<WorkspaceIsolationProjectTopology[]>(
      getInitialWorkspaceIsolationProjectTopologies,
    );
  const [workspaceIsolationIntroSeen, setWorkspaceIsolationIntroSeen] =
    useState<boolean>(getInitialWorkspaceIsolationIntroSeen);
  const [shellHookStatus, setShellHookStatus] =
    useState<WorkspaceIsolationShellHookStatus | null>(
      getInitialWorkspaceIsolationShellHookStatus,
    );

  const refreshWorkspaceIsolationState = async () => {
    const [stacks, topologies, hookStatus] = await Promise.all([
      getWorkspaceIsolationStacks(),
      getWorkspaceIsolationProjectTopologies(),
      getWorkspaceIsolationShellHookStatus(),
    ]);
    setWorkspaceIsolationStacks(stacks);
    setWorkspaceIsolationProjectTopologies(topologies);
    setShellHookStatus(hookStatus);
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

  const handleSaveWorkspaceIsolationProjectTopology = async (
    input: SaveWorkspaceIsolationInput,
  ) => {
    const result = await saveWorkspaceIsolationProjectTopology(input);
    if (!result.success) {
      return result;
    }
    await refreshWorkspaceIsolationState();
    return result;
  };

  const handleDeleteWorkspaceIsolationProjectTopology = async (
    topologyId: string,
  ) => {
    const result = await deleteWorkspaceIsolationProjectTopology(topologyId);
    if (result.success) {
      await refreshWorkspaceIsolationState();
    }
    return result;
  };

  const handleEnableWorkspaceIsolationForWorkspace = async (input: {
    projectId: string;
    projectName: string;
    workspaceRootPath: string;
    workspaceRootLabel: string;
  }) => {
    const result = await enableWorkspaceIsolationForWorkspace(input);
    if (result.success) {
      await refreshWorkspaceIsolationState();
    }
    return result;
  };

  const handleDisableWorkspaceIsolationForWorkspace = async (
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
    if (!topology) {
      return;
    }
    await handleDeleteWorkspaceIsolationProjectTopology(topology.id);
  };

  const handleSetShellHooksEnabled = async (enabled: boolean) => {
    const result = await setWorkspaceIsolationShellHooksEnabled(enabled);
    if (result.success) {
      void getWorkspaceIsolationShellHookStatus().then(setShellHookStatus);
    }
    return result;
  };

  const handleMarkWorkspaceIsolationIntroSeen = async () => {
    const result = await markWorkspaceIsolationIntroSeen();
    if (result.success && result.seen) {
      setWorkspaceIsolationIntroSeen(true);
    }
    return result;
  };

  const value: WorkspaceIsolationManagerValue = {
    workspaceIsolationStacks,
    workspaceIsolationProjectTopologies,
    workspaceIsolationIntroSeen,
    shellHookStatus,
    workspaceIsolationTopologyForProject,
    workspaceIsolationForWorkspace,
    saveWorkspaceIsolationProjectTopology:
      handleSaveWorkspaceIsolationProjectTopology,
    deleteWorkspaceIsolationProjectTopology:
      handleDeleteWorkspaceIsolationProjectTopology,
    enableWorkspaceIsolationForWorkspace:
      handleEnableWorkspaceIsolationForWorkspace,
    disableWorkspaceIsolationForWorkspace:
      handleDisableWorkspaceIsolationForWorkspace,
    deleteWorkspaceIsolationForProject,
    markWorkspaceIsolationIntroSeen: handleMarkWorkspaceIsolationIntroSeen,
    setShellHooksEnabled: handleSetShellHooksEnabled,
  };

  return (
    <WorkspaceIsolationManagerContext.Provider value={value}>
      {children}
    </WorkspaceIsolationManagerContext.Provider>
  );
};
