import {
  getWorkspaceIsolationErrorMessage,
  isWorkspaceIsolationStack,
  workspaceIsolationDesktopUnavailable,
  workspaceIsolationIpcUnavailable,
} from "@/services/workspace-isolation-guards";
import type { WorkspaceIsolationStack } from "@/types/workspace-isolation";

export const enableWorkspaceIsolationForWorkspace = async (input: {
  projectId: string;
  projectName: string;
  workspaceRootPath: string;
  workspaceRootLabel: string;
}): Promise<{ success: boolean; error?: string; stack?: WorkspaceIsolationStack }> => {
  if (typeof window === "undefined") {
    return {
      success: false,
      error: workspaceIsolationDesktopUnavailable,
    };
  }

  try {
    const result =
      await window.electronAPI?.enableWorkspaceIsolationForWorkspace?.(input);
    return {
      success: result?.success ?? false,
      error: result?.error,
      stack: isWorkspaceIsolationStack(result?.stack) ? result.stack : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: getWorkspaceIsolationErrorMessage(
        error,
        "Failed to activate Project Services.",
      ),
    };
  }
};

export const disableWorkspaceIsolationForWorkspace = async (
  workspaceRootPath: string,
): Promise<{ success: boolean; error?: string }> => {
  if (typeof window === "undefined") {
    return { success: false, error: workspaceIsolationDesktopUnavailable };
  }

  try {
    return (await window.electronAPI?.disableWorkspaceIsolationForWorkspace?.(
        workspaceRootPath,
      )) ?? {
        success: false,
        error: workspaceIsolationIpcUnavailable,
      };
  } catch (error) {
    return {
      success: false,
      error: getWorkspaceIsolationErrorMessage(
        error,
        "Failed to stop Project Services.",
      ),
    };
  }
};
