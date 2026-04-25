import type { WorkspaceIsolationConnectionProof } from "./workspace-isolation-connection-proof.js";
import type {
  WorkspaceIsolationProxyStatus,
  WorkspaceIsolationShellHookStatus,
} from "../types/electron.js";
import type {
  WorkspaceIsolationProjectTopology,
  WorkspaceIsolationStack,
} from "../types/workspace-isolation.js";

export type WorkspaceIsolationWorkspaceState =
  | "ready_to_activate"
  | "active"
  | "needs_attention"
  | "blocked";

export type WorkspaceIsolationWorkspaceReason =
  | "proxy_unavailable"
  | "auto_env_off"
  | "auto_env_unsupported"
  | "connected_target_not_live";

export interface WorkspaceIsolationWorkspaceStatus {
  state: WorkspaceIsolationWorkspaceState;
  reason: WorkspaceIsolationWorkspaceReason | null;
  hasDependencies: boolean;
  hasNonLiveDependencies: boolean;
}

export const getWorkspaceIsolationWorkspaceStatus = ({
  connectionProofs,
  proxyStatus,
  shellHookStatus,
  stack,
  topology,
}: {
  connectionProofs: WorkspaceIsolationConnectionProof[];
  proxyStatus: WorkspaceIsolationProxyStatus | null;
  shellHookStatus: WorkspaceIsolationShellHookStatus | null;
  stack: WorkspaceIsolationStack | null;
  topology: WorkspaceIsolationProjectTopology | null;
}): WorkspaceIsolationWorkspaceStatus | null => {
  if (!topology) {
    return null;
  }

  const hasDependencies = connectionProofs.length > 0;
  const hasNonLiveDependencies = connectionProofs.some(
    (connection) => connection.status !== "live_target",
  );

  if (proxyStatus && !proxyStatus.running) {
    return {
      state: "blocked",
      reason: "proxy_unavailable",
      hasDependencies,
      hasNonLiveDependencies,
    };
  }

  if (!stack) {
    return {
      state: "ready_to_activate",
      reason: null,
      hasDependencies,
      hasNonLiveDependencies,
    };
  }

  if (shellHookStatus?.supported === false) {
    return {
      state: "needs_attention",
      reason: "auto_env_unsupported",
      hasDependencies,
      hasNonLiveDependencies,
    };
  }

  if (shellHookStatus && !shellHookStatus.enabled) {
    return {
      state: "needs_attention",
      reason: "auto_env_off",
      hasDependencies,
      hasNonLiveDependencies,
    };
  }

  if (hasNonLiveDependencies) {
    return {
      state: "needs_attention",
      reason: "connected_target_not_live",
      hasDependencies,
      hasNonLiveDependencies,
    };
  }

  return {
    state: "active",
    reason: null,
    hasDependencies,
    hasNonLiveDependencies,
  };
};
