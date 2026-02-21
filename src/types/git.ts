export type GitFetchFailureReason =
  | "auth-cancelled"
  | "auth-required"
  | "network"
  | "unknown";

export interface GitFetchBranchesResult {
  success: boolean;
  error?: string;
  reason?: GitFetchFailureReason;
}
