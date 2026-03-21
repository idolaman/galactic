import {
  normalizeBranchName,
  validateNewBranchName,
} from "./create-workspace-request.js";

export interface ExistingBranchSelection {
  kind: "existing";
  branch: string;
}

export interface NewBranchSelection {
  kind: "new";
  branch: string;
}

export interface InvalidBranchSelection {
  kind: "invalid";
  error: string;
}

export interface EmptyBranchSelection {
  kind: "empty";
}

export type BranchSelectionResult =
  | ExistingBranchSelection
  | NewBranchSelection
  | InvalidBranchSelection
  | EmptyBranchSelection;

export interface CreateWorkspaceDialogVisibilityChange {
  shouldLoadBranches: boolean;
  shouldResetDialog: boolean;
}

export const resolveBranchSelection = (
  branchInput: string,
  existingBranches: string[],
): BranchSelectionResult => {
  const normalizedBranch = normalizeBranchName(branchInput);
  if (!normalizedBranch) {
    return { kind: "empty" };
  }

  if (existingBranches.includes(normalizedBranch)) {
    return { kind: "existing", branch: normalizedBranch };
  }

  const validationResult = validateNewBranchName(branchInput, existingBranches);
  if (!validationResult.isValid || !validationResult.normalizedBranch) {
    return {
      kind: "invalid",
      error: validationResult.error ?? "Branch name is invalid.",
    };
  }

  return { kind: "new", branch: validationResult.normalizedBranch };
};

export const normalizeBaseBranch = (value: string): string => value.trim();

export const filterBranchesByQuery = (
  branches: string[],
  query: string,
): string[] => {
  const normalizedQuery = normalizeBaseBranch(query).toLowerCase();
  if (!normalizedQuery) {
    return branches;
  }

  return branches.filter((branch) =>
    branch.toLowerCase().includes(normalizedQuery),
  );
};

export const shouldClearSelectedBaseBranch = (
  inputValue: string,
  selectedBaseBranch: string,
): boolean => {
  return normalizeBaseBranch(inputValue) !== normalizeBaseBranch(selectedBaseBranch);
};

export const canCreateWorkspaceFromNewBranch = (
  baseBranch: string,
  isCreatingWorkspace: boolean,
): boolean => {
  return !isCreatingWorkspace && normalizeBaseBranch(baseBranch).length > 0;
};

export const resolveCreateWorkspaceDialogVisibilityChange = (
  open: boolean,
): CreateWorkspaceDialogVisibilityChange => {
  if (!open) {
    return {
      shouldLoadBranches: false,
      shouldResetDialog: false,
    };
  }

  return {
    shouldLoadBranches: true,
    shouldResetDialog: true,
  };
};
