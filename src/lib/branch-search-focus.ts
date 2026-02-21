interface ShouldLoadBranchesOnFocusOptions {
  hasFetchedBranchesThisOpen: boolean;
  isCreatingWorkspace: boolean;
}

export const shouldLoadBranchesOnFocus = ({
  hasFetchedBranchesThisOpen,
  isCreatingWorkspace,
}: ShouldLoadBranchesOnFocusOptions): boolean => {
  return !isCreatingWorkspace && !hasFetchedBranchesThisOpen;
};

interface ShouldShowBranchSearchResultsOptions {
  branchSearchActive: boolean;
  isLoadingBranches: boolean;
}

export const shouldShowBranchSearchResults = ({
  branchSearchActive,
  isLoadingBranches,
}: ShouldShowBranchSearchResultsOptions): boolean => {
  return branchSearchActive || isLoadingBranches;
};

interface ShouldResetBranchSearchSessionOptions {
  open: boolean;
}

export const shouldResetBranchSearchSession = ({
  open,
}: ShouldResetBranchSearchSessionOptions): boolean => {
  return open;
};

interface ShouldHideBranchSearchOnBlurOptions {
  isDialogOpen: boolean;
}

export const shouldHideBranchSearchOnBlur = ({
  isDialogOpen,
}: ShouldHideBranchSearchOnBlurOptions): boolean => {
  // Keep the branch list expanded for the entire dialog session once activated.
  void isDialogOpen;
  return false;
};
