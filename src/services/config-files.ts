interface ApplyResult {
  success: boolean;
  error?: string;
}

interface ApplyAllResult {
  success: boolean;
  applied: string[];
  errors: Array<{ path: string; error: string }>;
}

export const applyConfigFile = async (
  projectPath: string,
  relativePath: string,
  content: string,
  ip: string,
): Promise<ApplyResult> => {
  if (typeof window === "undefined" || !window.electronAPI?.applyConfigFile) {
    return { success: false, error: "Config file operations are only available in the desktop app." };
  }

  try {
    return await window.electronAPI.applyConfigFile(projectPath, relativePath, content, ip);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to apply config file.",
    };
  }
};

export const applyAllConfigFiles = async (
  projectPath: string,
  configFiles: Record<string, string>,
  ip: string,
): Promise<ApplyAllResult> => {
  const applied: string[] = [];
  const errors: Array<{ path: string; error: string }> = [];

  for (const [relativePath, content] of Object.entries(configFiles)) {
    const result = await applyConfigFile(projectPath, relativePath, content, ip);
    if (result.success) {
      applied.push(relativePath);
    } else {
      errors.push({ path: relativePath, error: result.error ?? "Unknown error" });
    }
  }

  return {
    success: errors.length === 0,
    applied,
    errors,
  };
};
