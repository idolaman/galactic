import { execFile, type ExecFileException } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";
import type { IpcMain } from "electron";

const execFileAsync = promisify(execFile);

export interface CreateWorktreeOptions {
  createBranch?: boolean;
  startPoint?: string;
}

interface RegisterGitWorktreeIpcDeps {
  ipcMain: Pick<IpcMain, "handle">;
  workspaceCreated: (branch: string) => void;
  gitFailed: (operation: string, error: string) => void;
  projectPathExists?: (pathToCheck: string) => boolean;
  ensureDirectory?: (dirPath: string) => void;
  runGit?: (args: string[], cwd: string, env: NodeJS.ProcessEnv) => Promise<void>;
}

const resolveGitEnv = (): NodeJS.ProcessEnv => {
  return {
    ...process.env,
    GIT_LFS_SKIP_SMUDGE: "1",
    ...(process.platform === "darwin" && {
      PATH: [process.env.PATH ?? "", "/opt/homebrew/bin", "/usr/local/bin"]
        .filter(Boolean)
        .join(path.delimiter),
    }),
  };
};

const resolveWorktreeAddArgs = (
  targetPath: string,
  branch: string,
  options: CreateWorktreeOptions,
): string[] | null => {
  if (!options.createBranch) {
    return ["worktree", "add", targetPath, branch];
  }

  if (typeof options.startPoint !== "string" || options.startPoint.trim().length === 0) {
    return null;
  }

  const startPoint = options.startPoint.trim();
  return ["worktree", "add", "-b", branch, targetPath, startPoint];
};

const normalizeCreateWorktreeOptions = (value: unknown): CreateWorktreeOptions => {
  if (!value || typeof value !== "object") {
    return {};
  }

  const candidate = value as CreateWorktreeOptions;
  return {
    createBranch: candidate.createBranch,
    startPoint: candidate.startPoint,
  };
};

export const registerGitWorktreeIpc = ({
  ipcMain,
  workspaceCreated,
  gitFailed,
  projectPathExists = existsSync,
  ensureDirectory = (dirPath) => {
    mkdirSync(dirPath, { recursive: true });
  },
  runGit = async (args, cwd, env) => {
    await execFileAsync("git", args, { cwd, env });
  },
}: RegisterGitWorktreeIpcDeps): void => {
  ipcMain.handle(
    "git/create-worktree",
    async (_event, projectPath: string, branch: string, options?: CreateWorktreeOptions | null) => {
      const trimmedBranch = typeof branch === "string" ? branch.trim() : "";
      if (!projectPath || !trimmedBranch) {
        return { success: false, error: "Project path and branch are required." };
      }
      const normalizedOptions = normalizeCreateWorktreeOptions(options);
      if (normalizedOptions.createBranch && !normalizedOptions.startPoint?.trim()) {
        return { success: false, error: "Start point branch is required for new branch creation." };
      }

      const gitDirPath = path.join(projectPath, ".git");
      if (!projectPathExists(gitDirPath)) {
        return { success: false, error: "Git repository not found." };
      }

      const sanitizedBranch = trimmedBranch.replace(/[\\/]/g, "-");
      const projectParent = path.resolve(projectPath, "..");
      const projectName = path.basename(projectPath);
      const globalWorktreeRoot = path.join(projectParent, ".worktrees");
      const worktreeRoot = path.join(globalWorktreeRoot, projectName);
      const targetPath = path.join(worktreeRoot, sanitizedBranch);

      try {
        ensureDirectory(globalWorktreeRoot);
        ensureDirectory(worktreeRoot);
      } catch (error) {
        console.error("Failed to ensure worktree directory:", error);
        return { success: false, error: "Unable to prepare worktree directory." };
      }

      try {
        const env = resolveGitEnv();
        const args = resolveWorktreeAddArgs(targetPath, trimmedBranch, normalizedOptions);
        if (!args) {
          return { success: false, error: "Start point branch is required for new branch creation." };
        }
        await runGit(args, projectPath, env);
        workspaceCreated(trimmedBranch);
        return { success: true, path: targetPath };
      } catch (error) {
        console.error(`Failed to create worktree for ${trimmedBranch} at ${projectPath}:`, error);
        const execError = error as ExecFileException & { stderr?: string };
        const errorMessage = execError?.stderr || execError?.message || "Unknown error creating worktree.";
        gitFailed("worktree-add", errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      }
    },
  );
};
