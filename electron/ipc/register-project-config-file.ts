import type {
  BrowserWindow,
  IpcMain,
  OpenDialogOptions,
  OpenDialogReturnValue,
  SaveDialogOptions,
  SaveDialogReturnValue,
} from "electron";

interface ExportProjectConfigFileInput {
  defaultFileName: string;
  payload: unknown;
}

interface ProjectConfigFileIpcDeps {
  ipcMain: Pick<IpcMain, "handle">;
  getParentWindow?: () => BrowserWindow | null;
  showSaveDialog: (
    windowRef: BrowserWindow | null,
    options: SaveDialogOptions,
  ) => Promise<SaveDialogReturnValue>;
  showOpenDialog: (
    windowRef: BrowserWindow | null,
    options: OpenDialogOptions,
  ) => Promise<OpenDialogReturnValue>;
  writeFile: (filePath: string, contents: string, encoding: "utf-8") => Promise<void>;
  readFile: (filePath: string, encoding: "utf-8") => Promise<string>;
}

const jsonFilters = [{ name: "JSON", extensions: ["json"] }];

const isExportInput = (value: unknown): value is ExportProjectConfigFileInput =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as ExportProjectConfigFileInput).defaultFileName === "string" &&
  "payload" in value;

export const registerProjectConfigFileIpc = ({
  ipcMain,
  getParentWindow,
  showSaveDialog,
  showOpenDialog,
  writeFile,
  readFile,
}: ProjectConfigFileIpcDeps): void => {
  ipcMain.handle("project-config/export-file", async (_event, input: unknown) => {
    if (!isExportInput(input)) {
      return { canceled: false, success: false, error: "Invalid project config export request." };
    }

    const result = await showSaveDialog(getParentWindow?.() ?? null, {
      title: "Export Project Config",
      defaultPath: input.defaultFileName,
      filters: jsonFilters,
    });
    if (result.canceled || !result.filePath) {
      return { canceled: true };
    }

    try {
      const contents = JSON.stringify(input.payload, null, 2);
      if (typeof contents !== "string") {
        return {
          canceled: false,
          success: false,
          error: "Project config export payload is not valid JSON.",
        };
      }
      await writeFile(
        result.filePath,
        `${contents}\n`,
        "utf-8",
      );
      return { canceled: false, success: true, filePath: result.filePath };
    } catch (error) {
      return {
        canceled: false,
        success: false,
        error: error instanceof Error ? error.message : "Failed to export project config.",
      };
    }
  });

  ipcMain.handle("project-config/import-file", async () => {
    const result = await showOpenDialog(getParentWindow?.() ?? null, {
      title: "Import Project Config",
      properties: ["openFile"],
      filters: jsonFilters,
    });
    const filePath = result.filePaths[0];
    if (result.canceled || !filePath) {
      return { canceled: true };
    }

    try {
      return {
        canceled: false,
        success: true,
        filePath,
        payload: JSON.parse(await readFile(filePath, "utf-8")),
      };
    } catch {
      return {
        canceled: false,
        success: false,
        filePath,
        error: "Selected file is not valid JSON.",
      };
    }
  });
};
