import type { AppToastMessage, AppToastOptions } from "./app-toast.js";

interface WorktreeRemovalResult {
  success: boolean;
  alreadyRemoved?: boolean;
}

interface WorktreeRemovalDecision {
  shouldCleanup: boolean;
}

const DEFAULT_WORKTREE_REMOVAL_ERROR = "Please try again.";

export const evaluateWorktreeRemovalResult = (
  result: WorktreeRemovalResult,
): WorktreeRemovalDecision => {
  return {
    shouldCleanup: Boolean(result.success),
  };
};

export const getWorktreeRemovalLoadingToast = (): AppToastOptions => ({
  title: "Removing workspace...",
});

export const getWorktreeRemovalFailureToast = (
  errorMessage?: string,
): AppToastMessage => ({
  kind: "error",
  title: "Could not remove workspace",
  description: errorMessage?.trim() || DEFAULT_WORKTREE_REMOVAL_ERROR,
});
