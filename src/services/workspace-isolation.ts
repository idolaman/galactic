import type {
  WorkspaceIsolationProxyStatus,
  WorkspaceIsolationShellHookStatus,
} from "@/types/electron";
import type { SaveWorkspaceIsolationInput } from "@/hooks/workspace-isolation-manager-context";
import type { WorkspaceIsolationStack } from "@/types/workspace-isolation";

const isWorkspaceIsolationStack = (
  value: unknown,
): value is WorkspaceIsolationStack =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as WorkspaceIsolationStack).id === "string" &&
  Array.isArray((value as WorkspaceIsolationStack).services);

const toWorkspaceIsolationStacks = (value: unknown): WorkspaceIsolationStack[] =>
  Array.isArray(value) ? value.filter(isWorkspaceIsolationStack) : [];

const isWorkspaceIsolationProxyStatus = (
  value: unknown,
): value is WorkspaceIsolationProxyStatus =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as WorkspaceIsolationProxyStatus).running === "boolean" &&
  typeof (value as WorkspaceIsolationProxyStatus).port === "number";

const isWorkspaceIsolationShellHookStatus = (
  value: unknown,
): value is WorkspaceIsolationShellHookStatus =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as WorkspaceIsolationShellHookStatus).enabled === "boolean" &&
  typeof (value as WorkspaceIsolationShellHookStatus).supported === "boolean" &&
  typeof (value as WorkspaceIsolationShellHookStatus).installed === "boolean";

export const getInitialWorkspaceIsolationStacks = (): WorkspaceIsolationStack[] =>
  typeof window === "undefined"
    ? []
    : toWorkspaceIsolationStacks(
        window.electronAPI?.initialWorkspaceIsolationStacks ?? [],
      );

export const getInitialWorkspaceIsolationIntroSeen = (): boolean =>
  typeof window === "undefined"
    ? false
    : window.electronAPI?.initialWorkspaceIsolationIntroSeen === true;

export const getInitialWorkspaceIsolationShellHookStatus =
  (): WorkspaceIsolationShellHookStatus | null =>
    typeof window === "undefined"
      ? null
      : isWorkspaceIsolationShellHookStatus(
          window.electronAPI?.initialWorkspaceIsolationShellHookStatus,
        )
        ? window.electronAPI.initialWorkspaceIsolationShellHookStatus
        : null;

export const getWorkspaceIsolationStacks = async (): Promise<WorkspaceIsolationStack[]> =>
  typeof window === "undefined"
    ? []
    : toWorkspaceIsolationStacks(
        await window.electronAPI?.getWorkspaceIsolationStacks?.(),
      );

export const saveWorkspaceIsolationStack = async (
  input: SaveWorkspaceIsolationInput,
): Promise<{ success: boolean; error?: string; stack?: WorkspaceIsolationStack }> => {
  if (typeof window === "undefined") {
    return { success: false, error: "Workspace Isolation is only available in the desktop app." };
  }
  const result = await window.electronAPI?.saveWorkspaceIsolationStack?.(input);
  return {
    success: result?.success ?? false,
    error: result?.error,
    stack: isWorkspaceIsolationStack(result?.stack) ? result?.stack : undefined,
  };
};

export const deleteWorkspaceIsolationStack = async (
  stackId: string,
): Promise<{ success: boolean; error?: string }> =>
  typeof window === "undefined"
    ? { success: false, error: "Workspace Isolation is only available in the desktop app." }
    : await window.electronAPI?.deleteWorkspaceIsolationStack?.(stackId) ?? {
    success: false,
    error: "Workspace Isolation IPC bridge is unavailable.",
  };

export const markWorkspaceIsolationIntroSeen = async (): Promise<{
  success: boolean;
  seen: boolean;
  error?: string;
}> =>
  typeof window === "undefined"
    ? {
      success: false,
      seen: false,
      error: "Workspace Isolation is only available in the desktop app.",
    }
    : await window.electronAPI?.markWorkspaceIsolationIntroSeen?.() ?? {
      success: false,
      seen: false,
      error: "Workspace Isolation onboarding settings are unavailable.",
    };

export const getWorkspaceIsolationProxyStatus = async (): Promise<WorkspaceIsolationProxyStatus> => {
  if (typeof window === "undefined") {
    return {
      running: false,
      port: 1355,
      message: "Workspace Isolation proxy status is unavailable.",
    };
  }
  const result = await window.electronAPI?.getWorkspaceIsolationProxyStatus?.();
  return isWorkspaceIsolationProxyStatus(result)
    ? result
    : {
        running: false,
        port: 1355,
        message: "Workspace Isolation proxy status is unavailable.",
      };
};

export const getWorkspaceIsolationShellHookStatus = async (): Promise<WorkspaceIsolationShellHookStatus> =>
  typeof window === "undefined"
    ? {
      enabled: false,
      supported: false,
      installed: false,
      hookPath: null,
      zshrcPath: null,
      message: "Workspace Isolation shell hook status is unavailable.",
    }
    : await window.electronAPI?.getWorkspaceIsolationShellHookStatus?.() ?? {
    enabled: false,
    supported: false,
    installed: false,
    hookPath: null,
    zshrcPath: null,
    message: "Workspace Isolation shell hook status is unavailable.",
  };

export const setWorkspaceIsolationShellHooksEnabled = async (
  enabled: boolean,
): Promise<{ success: boolean; enabled: boolean; error?: string }> =>
  typeof window === "undefined"
    ? {
      success: false,
      enabled: false,
      error: "Workspace Isolation is only available in the desktop app.",
    }
    : await window.electronAPI?.setWorkspaceIsolationShellHooksEnabled?.(enabled) ?? {
    success: false,
    enabled: false,
    error: "Workspace Isolation shell hook settings are unavailable.",
  };
