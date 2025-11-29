import type { WorkspaceEnvConfig } from "@/types/electron";

export const writeCodeWorkspace = async (
  targetPath: string,
  envConfig: WorkspaceEnvConfig | null,
): Promise<{ success: boolean; workspacePath?: string; error?: string }> => {
  if (typeof window === "undefined") {
    return { success: false, error: "Workspace management is only available in the desktop app." };
  }

  try {
    const result = await window.electronAPI?.writeCodeWorkspace?.(targetPath, envConfig);
    return result ?? { success: false, error: "Workspace IPC bridge is unavailable." };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown workspace error.",
    };
  }
};

export const getCodeWorkspacePath = async (
  targetPath: string,
): Promise<{ exists: boolean; workspacePath: string } | null> => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return await window.electronAPI?.getCodeWorkspacePath?.(targetPath) ?? null;
  } catch (error) {
    console.error("Failed to get workspace path:", error);
    return null;
  }
};

export const deleteCodeWorkspace = async (
  targetPath: string,
): Promise<{ success: boolean; error?: string }> => {
  if (typeof window === "undefined") {
    return { success: false, error: "Workspace management is only available in the desktop app." };
  }

  try {
    const result = await window.electronAPI?.deleteCodeWorkspace?.(targetPath);
    return result ?? { success: false, error: "Workspace IPC bridge is unavailable." };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown workspace error.",
    };
  }
};

