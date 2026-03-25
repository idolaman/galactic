import type { AppToastMessage } from "@/lib/app-toast";
import type { GitFetchBranchesResult, GitFetchFailureReason } from "@/types/git";

export type FetchBranchesToastConfig = AppToastMessage;

const fetchReasonToToast: Record<GitFetchFailureReason, FetchBranchesToastConfig> = {
  "auth-cancelled": {
    kind: "info",
    title: "Fetch skipped",
    description: "Git authentication was cancelled. Showing cached branches.",
  },
  "auth-required": {
    kind: "info",
    title: "Authentication required",
    description: "Git needs credentials for remote fetch. Showing cached branches.",
  },
  network: {
    kind: "error",
    title: "Fetch failed",
    description: "Unable to reach remote. Showing cached branches.",
  },
  unknown: {
    kind: "error",
    title: "Fetch failed",
    description: "Unable to fetch remote branches. Showing cached branches.",
  },
};

export const getFetchBranchesToast = (
  result: GitFetchBranchesResult,
): FetchBranchesToastConfig | null => {
  if (result.success) {
    return null;
  }

  const reason = result.reason ?? "unknown";
  const config = fetchReasonToToast[reason];

  if ((reason === "network" || reason === "unknown") && result.error) {
    return {
      ...config,
      description: result.error.trim() || config.description,
    };
  }

  return config;
};
