import {
  getWorkspaceIsolationErrorMessage,
  workspaceIsolationDesktopUnavailable,
} from "@/services/workspace-isolation-guards";

const activeUserRequiredError =
  "Project Services storage requires an active signed-in user.";

export const setWorkspaceIsolationActiveUser = async (
  userId: string,
): Promise<{ success: boolean; error?: string }> => {
  if (!userId.trim()) {
    return { success: false, error: activeUserRequiredError };
  }

  if (typeof window === "undefined") {
    return { success: false, error: workspaceIsolationDesktopUnavailable };
  }

  try {
    return (await window.electronAPI?.setWorkspaceIsolationActiveUser?.(userId)) ?? {
      success: false,
      error: "Project Services storage scope is unavailable.",
    };
  } catch (error) {
    return {
      success: false,
      error: getWorkspaceIsolationErrorMessage(
        error,
        "Failed to set Project Services storage scope.",
      ),
    };
  }
};

export const clearWorkspaceIsolationActiveUser =
  async (): Promise<{ success: boolean; error?: string }> => {
    if (typeof window === "undefined") {
      return { success: false, error: workspaceIsolationDesktopUnavailable };
    }

    try {
      return (await window.electronAPI?.clearWorkspaceIsolationActiveUser?.()) ?? {
        success: false,
        error: "Project Services storage scope is unavailable.",
      };
    } catch (error) {
      return {
        success: false,
        error: getWorkspaceIsolationErrorMessage(
          error,
          "Failed to clear Project Services storage scope.",
        ),
      };
    }
  };
