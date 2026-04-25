import type {
  WorkspaceIsolationWorkspaceReason,
  WorkspaceIsolationWorkspaceState,
  WorkspaceIsolationWorkspaceStatus,
} from "./workspace-isolation-status.js";

export const getWorkspaceIsolationStateTitle = (
  state: WorkspaceIsolationWorkspaceState,
): string =>
  state === "ready_to_activate"
    ? "This workspace: Ready to activate"
    : state === "active"
      ? "This workspace: Active"
      : state === "needs_attention"
        ? "This workspace: Needs attention"
        : "This workspace: Blocked";

export const getWorkspaceIsolationReasonLabel = (
  reason: WorkspaceIsolationWorkspaceReason | null,
): string | null =>
  reason === "proxy_unavailable"
    ? "Proxy unavailable"
    : reason === "auto_env_off"
      ? "Auto-Env off"
      : reason === "auto_env_unsupported"
        ? "zsh only"
        : reason === "connected_target_not_live"
          ? "Connected target not live"
          : null;

export const getWorkspaceIsolationStateDescription = (
  status: WorkspaceIsolationWorkspaceStatus,
): string =>
  status.state === "ready_to_activate"
    ? "Not active in this workspace yet. Project Services is already set up for this project."
    : status.state === "active"
      ? "Project Services routes are live for this workspace."
      : status.reason === "proxy_unavailable"
        ? "Project Services cannot route this workspace until the local proxy is available."
        : status.reason === "auto_env_unsupported"
          ? "Routes are live here, but Terminal Auto-Env currently supports zsh only."
          : status.reason === "auto_env_off"
            ? "Routes are live here, but terminal commands will not automatically use workspace values yet."
            : "Routes are live here, but one or more connected targets are not currently live.";
