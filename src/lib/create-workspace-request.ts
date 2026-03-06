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

const INVALID_BRANCH_CHARACTERS = /[\x7f ~^:?*[\]\\]/;
const INVALID_BRANCH_SUBSTRINGS = ["..", "@{", "//"] as const;

const hasAsciiControlCharacter = (value: string): boolean => {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if ((code >= 0 && code <= 31) || code === 127) {
      return true;
    }
  }
  return false;
};

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
    hasAsciiControlCharacter(normalizedBranch) ||
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
