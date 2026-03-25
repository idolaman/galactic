import type { AppToastMessage } from "./app-toast.js";

export interface CreateWorkspaceFailureOptions {
  errorMessage?: string;
  fallbackDescription: string;
}

export const DEFAULT_CREATE_WORKSPACE_COMMAND_ERROR =
  "Unknown error running git worktree.";
export const DEFAULT_CREATE_WORKSPACE_UNKNOWN_ERROR =
  "Unknown workspace creation error.";

export const getCreateWorkspaceFailureToast = ({
  errorMessage,
  fallbackDescription,
}: CreateWorkspaceFailureOptions): AppToastMessage => {
  const description = errorMessage?.trim() || fallbackDescription;

  return {
    kind: "error",
    title: "Failed to create workspace",
    description,
  };
};
