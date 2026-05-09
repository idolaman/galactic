import {
  isWorkspaceIsolationShellHookStatus,
} from "@/services/workspace-isolation-guards";
import type { WorkspaceIsolationShellHookStatus } from "@/types/electron";

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
