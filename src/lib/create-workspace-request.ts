export interface CreateWorkspaceRequest {
  branch: string;
  createBranch?: boolean;
  startPoint?: string;
}

export interface NewBranchValidationResult {
  isValid: boolean;
  normalizedBranch: string;
  error?: string;
}

const INVALID_BRANCH_CHARACTERS = /[\u0000-\u001f\u007f ~^:?*[\]\\]/;
const INVALID_BRANCH_SUBSTRINGS = ["..", "@{", "//"] as const;

export const normalizeBranchName = (value: string): string => value.trim();

export const validateNewBranchName = (
  branchName: string,
  existingBranches: string[],
): NewBranchValidationResult => {
  const normalizedBranch = normalizeBranchName(branchName);
  if (!normalizedBranch) {
    return { isValid: false, normalizedBranch, error: "Branch name is required." };
  }

  if (
    normalizedBranch.startsWith(".") ||
    normalizedBranch.startsWith("/") ||
    normalizedBranch.endsWith("/") ||
    normalizedBranch.endsWith(".") ||
    normalizedBranch.endsWith(".lock") ||
    INVALID_BRANCH_CHARACTERS.test(normalizedBranch) ||
    INVALID_BRANCH_SUBSTRINGS.some((entry) => normalizedBranch.includes(entry))
  ) {
    return { isValid: false, normalizedBranch, error: "Branch name is invalid." };
  }

  if (existingBranches.includes(normalizedBranch)) {
    return { isValid: false, normalizedBranch, error: "Branch already exists." };
  }

  return { isValid: true, normalizedBranch };
};
