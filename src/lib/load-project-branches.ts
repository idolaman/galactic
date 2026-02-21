type BranchFetchFailureReason = "auth-cancelled" | "auth-required" | "network" | "unknown";

interface BranchFetchResult {
  success: boolean;
  error?: string;
  reason?: BranchFetchFailureReason;
}

interface BranchProject {
  path: string;
  isGitRepo: boolean;
}

interface ToastOptions {
  title: string;
  description: string;
  variant?: "default" | "destructive";
}

interface LoadProjectBranchesDependencies {
  fetchBranches: (projectPath: string) => Promise<BranchFetchResult>;
  listBranches: (projectPath: string) => Promise<string[]>;
  getFetchBranchesToast: (result: BranchFetchResult) => ToastOptions | null;
}

interface LoadProjectBranchesCallbacks {
  setIsLoadingBranches: (loading: boolean) => void;
  setProjectBranches: (branches: string[]) => void;
  toast: (options: ToastOptions) => void;
}

export const loadProjectBranchesCore = async (
  project: BranchProject | null,
  dependencies: LoadProjectBranchesDependencies,
  callbacks: LoadProjectBranchesCallbacks,
): Promise<void> => {
  if (!project?.path || !project.isGitRepo) {
    callbacks.setProjectBranches([]);
    return;
  }

  callbacks.setIsLoadingBranches(true);

  try {
    const fetchResult = await dependencies.fetchBranches(project.path);
    const fetchToast = dependencies.getFetchBranchesToast(fetchResult);
    if (fetchToast) {
      callbacks.toast(fetchToast);
    }

    const branches = await dependencies.listBranches(project.path);
    callbacks.setProjectBranches(branches);
  } finally {
    callbacks.setIsLoadingBranches(false);
  }
};

export type { BranchProject, ToastOptions };
