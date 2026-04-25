import {
  defaultProxyStatus,
  defaultShellHookStatus,
  getWorkspaceIsolationErrorMessage,
  isWorkspaceIsolationProxyStatus,
  isWorkspaceIsolationShellHookStatus,
  workspaceIsolationDesktopUnavailable,
} from "@/services/workspace-isolation-guards";
import type {
  WorkspaceIsolationProxyStatus,
  WorkspaceIsolationShellHookStatus,
} from "@/types/electron";

export const markWorkspaceIsolationIntroSeen = async (): Promise<{
  success: boolean;
  seen: boolean;
  error?: string;
}> => {
  if (typeof window === "undefined") {
    return {
      success: false,
      seen: false,
      error: workspaceIsolationDesktopUnavailable,
    };
  }

  try {
    return (await window.electronAPI?.markWorkspaceIsolationIntroSeen?.()) ?? {
      success: false,
      seen: false,
      error: "Workspace Isolation onboarding settings are unavailable.",
    };
  } catch (error) {
    return {
      success: false,
      seen: false,
      error: getWorkspaceIsolationErrorMessage(
        error,
        "Workspace Isolation onboarding settings are unavailable.",
      ),
    };
  }
};

export const getWorkspaceIsolationProxyStatus =
  async (): Promise<WorkspaceIsolationProxyStatus> => {
    if (typeof window === "undefined") {
      return defaultProxyStatus();
    }

    try {
      const result = await window.electronAPI?.getWorkspaceIsolationProxyStatus?.();
      return isWorkspaceIsolationProxyStatus(result) ? result : defaultProxyStatus();
    } catch (error) {
      return defaultProxyStatus(
        getWorkspaceIsolationErrorMessage(
          error,
          "Workspace Isolation proxy status is unavailable.",
        ),
      );
    }
  };

export const getWorkspaceIsolationShellHookStatus =
  async (): Promise<WorkspaceIsolationShellHookStatus> => {
    if (typeof window === "undefined") {
      return defaultShellHookStatus();
    }

    try {
      const result = await window.electronAPI?.getWorkspaceIsolationShellHookStatus?.();
      return isWorkspaceIsolationShellHookStatus(result)
        ? result
        : defaultShellHookStatus();
    } catch (error) {
      return defaultShellHookStatus(
        getWorkspaceIsolationErrorMessage(
          error,
          "Workspace Isolation shell hook status is unavailable.",
        ),
      );
    }
  };

export const setWorkspaceIsolationShellHooksEnabled = async (
  enabled: boolean,
): Promise<{ success: boolean; enabled: boolean; error?: string }> => {
  if (typeof window === "undefined") {
    return {
      success: false,
      enabled: false,
      error: workspaceIsolationDesktopUnavailable,
    };
  }

  try {
    return (await window.electronAPI?.setWorkspaceIsolationShellHooksEnabled?.(
        enabled,
      )) ?? {
        success: false,
        enabled: false,
        error: "Workspace Isolation shell hook settings are unavailable.",
      };
  } catch (error) {
    return {
      success: false,
      enabled: false,
      error: getWorkspaceIsolationErrorMessage(
        error,
        "Workspace Isolation shell hook settings are unavailable.",
      ),
    };
  }
};
