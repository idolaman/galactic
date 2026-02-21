import type { GitFetchBranchesResult, GitFetchFailureReason } from "@/types/git";

export interface FetchBranchesToastConfig {
  title: string;
  description: string;
  variant: "default" | "destructive";
}

const fetchReasonToToast: Record<GitFetchFailureReason, FetchBranchesToastConfig> = {
  "auth-cancelled": {
    title: "Fetch skipped",
    description: "Git authentication was cancelled. Showing cached branches.",
    variant: "default",
  },
  "auth-required": {
    title: "Authentication required",
    description: "Git needs credentials for remote fetch. Showing cached branches.",
    variant: "default",
  },
  network: {
    title: "Fetch failed",
    description: "Unable to reach remote. Showing cached branches.",
    variant: "destructive",
  },
  unknown: {
    title: "Fetch failed",
    description: "Unable to fetch remote branches. Showing cached branches.",
    variant: "destructive",
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
