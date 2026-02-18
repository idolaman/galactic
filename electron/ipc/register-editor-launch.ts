import { existsSync } from "node:fs";
import type { IpcMain } from "electron";
import { createEditorLaunchService } from "../editor-launch/service.js";
import type {
  EditorLaunchService,
  OpenProjectInEditorResult,
  SupportedEditorName,
} from "../editor-launch/types.js";

interface EditorLaunchIpcDeps {
  ipcMain: Pick<IpcMain, "handle">;
  editorLaunched: (editor: SupportedEditorName) => void;
  projectPathExists?: (projectPath: string) => boolean;
  editorLaunchService?: EditorLaunchService;
}

export const registerEditorLaunchIpc = ({
  ipcMain,
  editorLaunched,
  projectPathExists = existsSync,
  editorLaunchService = createEditorLaunchService(),
}: EditorLaunchIpcDeps): void => {
  ipcMain.handle("check-editor-installed", async (_event, editorName: string) => {
    return await editorLaunchService.checkEditorInstalled(editorName);
  });

  ipcMain.handle(
    "editor/open-project",
    async (_event, editorName: string, projectPath: string): Promise<OpenProjectInEditorResult> => {
      if (!projectPath) {
        return { success: false, error: "No project path provided." };
      }

      if (!projectPathExists(projectPath)) {
        return { success: false, error: "Project path does not exist." };
      }

      const result = await editorLaunchService.openProject(editorName, projectPath);
      if (result.success && result.usedEditor) {
        editorLaunched(result.usedEditor);
      }

      return result;
    },
  );
};
