import type { CopySyncTargetsResult, SyncTarget } from "@/types/sync-target";

export const searchProjectSyncTargets = async (
  projectPath: string,
  query: string,
): Promise<SyncTarget[]> => {
  if (!projectPath || typeof window === "undefined") {
    return [];
  }

  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const targets = await window.electronAPI?.searchProjectSyncTargets?.(projectPath, query);
    if (!targets || !Array.isArray(targets)) {
      return [];
    }
    return targets;
  } catch (error) {
    console.error("Failed to search project sync targets:", error);
    return [];
  }
};

export const copyProjectSyncTargetsToWorktree = async (
  projectPath: string,
  worktreePath: string,
  targets: SyncTarget[],
): Promise<CopySyncTargetsResult> => {
  if (!projectPath || !worktreePath || !Array.isArray(targets) || targets.length === 0 || typeof window === "undefined") {
    return { success: false, copied: [], skipped: [], errors: [{ file: "*", message: "Invalid copy request." }] };
  }

  try {
    const result = await window.electronAPI?.copyProjectSyncTargetsToWorktree?.(
      projectPath,
      worktreePath,
      targets,
    );
    if (!result) {
      return { success: false, copied: [], skipped: [], errors: [{ file: "*", message: "Copy operation failed." }] };
    }

    return {
      success: Boolean(result.success),
      copied: Array.isArray(result.copied) ? result.copied : [],
      skipped: Array.isArray(result.skipped) ? result.skipped : [],
      errors: result.errors,
    };
  } catch (error) {
    console.error("Failed to copy config sync targets:", error);
    return {
      success: false,
      copied: [],
      skipped: [],
      errors: [{ file: "*", message: error instanceof Error ? error.message : "Unknown copy error." }],
    };
  }
};
