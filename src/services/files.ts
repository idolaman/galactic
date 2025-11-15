export const searchProjectFiles = async (projectPath: string, query: string): Promise<string[]> => {
  if (!projectPath || typeof window === "undefined") {
    return [];
  }

  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const files = await window.electronAPI?.searchProjectFiles?.(projectPath, query);
    if (!files || !Array.isArray(files)) {
      return [];
    }
    return files;
  } catch (error) {
    console.error("Failed to search project files:", error);
    return [];
  }
};

export interface CopyConfigFilesResult {
  success: boolean;
  copied: string[];
  errors?: Array<{ file: string; message: string }>;
}

export const copyProjectFilesToWorktree = async (
  projectPath: string,
  worktreePath: string,
  files: string[],
): Promise<CopyConfigFilesResult> => {
  if (!projectPath || !worktreePath || !Array.isArray(files) || files.length === 0 || typeof window === "undefined") {
    return { success: false, copied: [], errors: [{ file: "*", message: "Invalid copy request." }] };
  }

  try {
    const result = await window.electronAPI?.copyProjectFilesToWorktree?.(projectPath, worktreePath, files);
    if (!result) {
      return { success: false, copied: [], errors: [{ file: "*", message: "Copy operation failed." }] };
    }

    return {
      success: Boolean(result.success),
      copied: Array.isArray(result.copied) ? result.copied : [],
      errors: result.errors,
    };
  } catch (error) {
    console.error("Failed to copy config files:", error);
    return {
      success: false,
      copied: [],
      errors: [{ file: "*", message: error instanceof Error ? error.message : "Unknown copy error." }],
    };
  }
};
