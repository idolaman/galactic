export interface ProjectConfigFileExportInput {
  defaultFileName: string;
  payload: unknown;
}

export interface ProjectConfigFileExportResult {
  canceled: boolean;
  success?: boolean;
  filePath?: string;
  error?: string;
}

export interface ProjectConfigFileImportResult {
  canceled: boolean;
  success?: boolean;
  payload?: unknown;
  filePath?: string;
  error?: string;
}

const desktopUnavailable = "Project config files are only available in the desktop app.";

export const exportProjectConfigFile = async (
  input: ProjectConfigFileExportInput,
): Promise<ProjectConfigFileExportResult> => {
  if (typeof window === "undefined") {
    return { canceled: false, success: false, error: desktopUnavailable };
  }

  try {
    return (
      (await window.electronAPI?.exportProjectConfigFile?.(input)) ?? {
        canceled: false,
        success: false,
        error: "Project config export is unavailable.",
      }
    );
  } catch (error) {
    return {
      canceled: false,
      success: false,
      error: error instanceof Error ? error.message : "Project config export failed.",
    };
  }
};

export const importProjectConfigFile =
  async (): Promise<ProjectConfigFileImportResult> => {
    if (typeof window === "undefined") {
      return { canceled: false, success: false, error: desktopUnavailable };
    }

    try {
      return (
        (await window.electronAPI?.importProjectConfigFile?.()) ?? {
          canceled: false,
          success: false,
          error: "Project config import is unavailable.",
        }
      );
    } catch (error) {
      return {
        canceled: false,
        success: false,
        error: error instanceof Error ? error.message : "Project config import failed.",
      };
    }
  };
