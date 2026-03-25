import type { AppToastMessage, AppToastOptions } from "./app-toast.js";

interface WorktreeRemovalResult {
  success: boolean;
  alreadyRemoved?: boolean;
}

interface WorktreeRemovalDecision {
  shouldCleanup: boolean;
}

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

export const getWorktreeRemovalFailureToast = (): AppToastMessage => ({
  kind: "error",
  title: "Could not remove workspace",
  description: "Please try again.",
});
