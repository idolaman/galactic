import path from "node:path";
import type { IpcMain } from "electron";
import { copySyncTargetsToWorktree } from "../project-sync/copy.js";
import { sanitizeSyncTarget } from "../project-sync/path-utils.js";
import { searchSyncTargetsInProject } from "../project-sync/search.js";
import type { SyncTarget } from "../project-sync/types.js";

interface ProjectSyncIpcDeps {
  ipcMain: Pick<IpcMain, "handle">;
  workspaceFilesCopied: (count: number, success: boolean) => void;
}

export const registerProjectSyncIpc = ({
  ipcMain,
  workspaceFilesCopied,
}: ProjectSyncIpcDeps): void => {
  ipcMain.handle("project/search-sync-targets", async (_event, projectPath: string, query: string) => {
    if (!projectPath) {
      return [];
    }

    try {
      return await searchSyncTargetsInProject(path.resolve(projectPath), query ?? "");
    } catch (error) {
      console.error(`Failed to search sync targets for ${projectPath}:`, error);
      return [];
    }
  });

  ipcMain.handle(
    "project/copy-sync-targets-to-worktree",
    async (_event, projectPath: string, worktreePath: string, targets: SyncTarget[]) => {
      if (!projectPath || !worktreePath || !Array.isArray(targets) || targets.length === 0) {
        return { success: false, copied: [], skipped: [], errors: [{ file: "", message: "Invalid copy parameters." }] };
      }

      try {
        const validTargets = targets
          .map((target) => sanitizeSyncTarget(target))
          .filter((target): target is SyncTarget => Boolean(target));
        if (validTargets.length === 0) {
          return { success: false, copied: [], skipped: [], errors: [{ file: "", message: "No valid sync targets." }] };
        }

        const result = await copySyncTargetsToWorktree(projectPath, worktreePath, validTargets);
        workspaceFilesCopied(result.copied.length, result.success);
        return result;
      } catch (error) {
        console.error(`Failed to copy sync targets into worktree ${worktreePath}:`, error);
        workspaceFilesCopied(0, false);
        return {
          success: false,
          copied: [],
          skipped: [],
          errors: [{ file: "*", message: error instanceof Error ? error.message : "Unknown copy error." }],
        };
      }
    },
  );
};
