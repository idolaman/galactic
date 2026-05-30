import type { SaveWorkspaceIsolationInput } from "@/hooks/workspace-isolation-manager-context";
import {
  getWorkspaceIsolationErrorMessage,
  isWorkspaceIsolationProjectTopology,
  toWorkspaceIsolationProjectTopologies,
  toWorkspaceIsolationStacks,
  workspaceIsolationDesktopUnavailable,
  workspaceIsolationIpcUnavailable,
} from "@/services/workspace-isolation-guards";
import type {
  WorkspaceIsolationStacksResult,
  WorkspaceIsolationTopologiesResult,
} from "@/types/electron";
import type {
  WorkspaceIsolationProjectTopology,
  WorkspaceIsolationStack,
} from "@/types/workspace-isolation";

const getStacksPayload = (value: WorkspaceIsolationStacksResult | undefined): unknown[] => {
  if (value?.success === true && Array.isArray(value.stacks)) {
    return value.stacks;
  }
  if (value?.success === false && typeof value.error === "string") {
    console.warn(value.error);
  }
  return [];
};

const getTopologiesPayload = (value: WorkspaceIsolationTopologiesResult | undefined): unknown[] => {
  if (value?.success === true && Array.isArray(value.topologies)) {
    return value.topologies;
  }
  if (value?.success === false && typeof value.error === "string") {
    console.warn(value.error);
  }
  return [];
};

export const getWorkspaceIsolationStacks =
  async (): Promise<WorkspaceIsolationStack[]> => {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      return toWorkspaceIsolationStacks(
        getStacksPayload(await window.electronAPI?.getWorkspaceIsolationStacks?.()),
      );
    } catch (error) {
      console.warn("Failed to load Workspace Isolation stacks:", error);
      return [];
    }
  };

export const getWorkspaceIsolationProjectTopologies =
  async (): Promise<WorkspaceIsolationProjectTopology[]> => {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      return toWorkspaceIsolationProjectTopologies(
        getTopologiesPayload(
          await window.electronAPI?.getWorkspaceIsolationProjectTopologies?.(),
        ),
      );
    } catch (error) {
      console.warn("Failed to load Workspace Isolation topologies:", error);
      return [];
    }
  };

export const saveWorkspaceIsolationProjectTopology = async (
  input: SaveWorkspaceIsolationInput,
): Promise<{
  success: boolean;
  error?: string;
  topology?: WorkspaceIsolationProjectTopology;
}> => {
  if (typeof window === "undefined") {
    return {
      success: false,
      error: workspaceIsolationDesktopUnavailable,
    };
  }

  try {
    const result =
      await window.electronAPI?.saveWorkspaceIsolationProjectTopology?.(input);
    return {
      success: result?.success ?? false,
      error: result?.error,
      topology: isWorkspaceIsolationProjectTopology(result?.topology)
        ? result.topology
        : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: getWorkspaceIsolationErrorMessage(
        error,
        "Failed to save Project Services.",
      ),
    };
  }
};

export const deleteWorkspaceIsolationProjectTopology = async (
  topologyId: string,
): Promise<{ success: boolean; error?: string }> => {
  if (typeof window === "undefined") {
    return { success: false, error: workspaceIsolationDesktopUnavailable };
  }

  try {
    return (await window.electronAPI?.deleteWorkspaceIsolationProjectTopology?.(
        topologyId,
      )) ?? {
        success: false,
        error: workspaceIsolationIpcUnavailable,
      };
  } catch (error) {
    return {
      success: false,
      error: getWorkspaceIsolationErrorMessage(
        error,
        "Failed to remove Project Services.",
      ),
    };
  }
};
