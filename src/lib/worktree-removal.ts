interface WorktreeRemovalResult {
  success: boolean;
  alreadyRemoved?: boolean;
}

interface WorktreeRemovalDecision {
  shouldCleanup: boolean;
}

interface WorktreeRemovalToast {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

export const evaluateWorktreeRemovalResult = (
  result: WorktreeRemovalResult,
): WorktreeRemovalDecision => {
  return {
    shouldCleanup: Boolean(result.success),
  };
};

export const getWorktreeRemovalFailureToast = (): WorktreeRemovalToast => ({
  title: "Could not remove workspace",
  description: "Please try again.",
  variant: "destructive",
});
