export interface GitInfo {
  isGitRepo: boolean;
  currentBranch?: string | null;
}

const defaultGitInfo: GitInfo = { isGitRepo: false, currentBranch: null };
const defaultBranches: string[] = [];

export const getGitInfo = async (projectPath: string): Promise<GitInfo> => {
  if (!projectPath || typeof window === "undefined") {
    return defaultGitInfo;
  }

  try {
    const info = await window.electronAPI?.getGitInfo?.(projectPath);
    if (!info) {
      return defaultGitInfo;
    }

    return {
      isGitRepo: info.isGitRepo,
      currentBranch: info.currentBranch ?? null,
    };
  } catch (error) {
    console.error("Failed to fetch git info:", error);
    return defaultGitInfo;
  }
};

export const listBranches = async (projectPath: string): Promise<string[]> => {
  if (!projectPath || typeof window === "undefined") {
    return defaultBranches;
  }

  try {
    const branches = await window.electronAPI?.listGitBranches?.(projectPath);
    if (!branches || !Array.isArray(branches)) {
      return defaultBranches;
    }
    return branches;
  } catch (error) {
    console.error("Failed to list git branches:", error);
    return defaultBranches;
  }
};
