import type {
  WorkspaceIsolationConnectionProof,
  WorkspaceIsolationConnectionProofStatus,
} from "./workspace-isolation-connection-proof.js";
import type { WorkspaceIsolationStack } from "../types/workspace-isolation.js";

export const getWorkspaceIsolationConnectionProofLabel = (
  stack: Pick<WorkspaceIsolationStack, "projectName" | "workspaceRootLabel">,
  connection: Pick<
    WorkspaceIsolationConnectionProof,
    "status" | "targetName" | "targetProjectName" | "targetWorkspaceLabel"
  >,
): string => {
  if (connection.status === "missing_target") {
    return "Missing target";
  }

  const isCurrentWorkspace =
    stack.projectName === connection.targetProjectName &&
    stack.workspaceRootLabel === connection.targetWorkspaceLabel;

  return isCurrentWorkspace
    ? connection.targetName
    : `${connection.targetProjectName} / ${connection.targetWorkspaceLabel} / ${connection.targetName}`;
};

export const getWorkspaceIsolationConnectionProofStatusLabel = (
  status: WorkspaceIsolationConnectionProofStatus,
): string =>
  status === "live_target"
    ? "Live target"
    : status === "configured_target"
      ? "Configured target"
      : "Missing target";
