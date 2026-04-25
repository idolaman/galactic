import {
  isWorkspaceIsolationShellHookStatus,
  toWorkspaceIsolationProjectTopologies,
  toWorkspaceIsolationStacks,
} from "@/services/workspace-isolation-guards";
import type { WorkspaceIsolationShellHookStatus } from "@/types/electron";
import type {
  WorkspaceIsolationProjectTopology,
  WorkspaceIsolationStack,
} from "@/types/workspace-isolation";

export const getInitialWorkspaceIsolationStacks = (): WorkspaceIsolationStack[] =>
  typeof window === "undefined"
    ? []
    : toWorkspaceIsolationStacks(
        window.electronAPI?.initialWorkspaceIsolationStacks ?? [],
      );

export const getInitialWorkspaceIsolationProjectTopologies =
  (): WorkspaceIsolationProjectTopology[] =>
    typeof window === "undefined"
      ? []
      : toWorkspaceIsolationProjectTopologies(
          window.electronAPI?.initialWorkspaceIsolationProjectTopologies ?? [],
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
