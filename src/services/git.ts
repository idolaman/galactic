export interface GitInfo {
  isGitRepo: boolean;
}

const defaultGitInfo: GitInfo = { isGitRepo: false };
const defaultBranches: string[] = [];

export interface WorktreeResult {
  success: boolean;
  path?: string;
  error?: string;
}

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

export const createWorktree = async (projectPath: string, branch: string): Promise<WorktreeResult> => {
  if (!projectPath || !branch || typeof window === "undefined") {
    return { success: false, error: "Invalid project or branch." };
  }

  try {
    const result = await window.electronAPI?.createGitWorktree?.(projectPath, branch);
    if (!result) {
      return { success: false, error: "Worktree creation failed." };
    }
    return result;
  } catch (error) {
    console.error("Failed to create worktree:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown worktree error.",
    };
  }
};

export const removeWorktree = async (projectPath: string, workspacePath: string): Promise<WorktreeResult> => {
  if (!projectPath || !workspacePath || typeof window === "undefined") {
    return { success: false, error: "Invalid project or workspace." };
  }

  try {
    const result = await window.electronAPI?.removeGitWorktree?.(projectPath, workspacePath);
    if (!result) {
      return { success: false, error: "Worktree removal failed." };
    }
    return result;
  } catch (error) {
    console.error("Failed to remove worktree:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown worktree error.",
    };
  }
};
