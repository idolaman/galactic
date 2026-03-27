import { execFile } from "node:child_process";
import { promises as fsPromises } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import type { ExecFileException } from "node:child_process";
import { collectDirectoryReportPaths } from "./collect-directory-report-paths.js";
import { copyEntry, pathExists } from "./copy-entry.js";
import { isWithinRoot, normalizeSyncTargetPath, normalizeSyncTargets } from "./path-utils.js";
import type { CopySyncTargetError, CopySyncTargetsResult, SyncTarget } from "./types.js";

const DITTO_PATH = "/usr/bin/ditto";
const execFileAsync = promisify(execFile);

const replaceExistingTarget = async (targetPath: string) => {
  if (!(await pathExists(targetPath))) {
    return;
  }

  await fsPromises.rm(targetPath, { force: true, recursive: true });
};

const copyDirectoryTarget = async (sourcePath: string, targetPath: string) => {
  await replaceExistingTarget(targetPath);
  await fsPromises.mkdir(path.dirname(targetPath), { recursive: true });
  await execFileAsync(DITTO_PATH, [sourcePath, targetPath]);
};

const copyFileTarget = async (sourcePath: string, targetPath: string) => {
  await replaceExistingTarget(targetPath);
  await fsPromises.mkdir(path.dirname(targetPath), { recursive: true });
  await copyEntry(sourcePath, targetPath);
};

export const copySyncTargetsToWorktree = async (
  projectPath: string,
  worktreePath: string,
  targets: SyncTarget[],
): Promise<CopySyncTargetsResult> => {
  const projectRoot = path.resolve(projectPath);
  const worktreeRoot = path.resolve(worktreePath);
  const copied: string[] = [];
  const skipped: string[] = [];
  const errors: CopySyncTargetError[] = [];
  const normalizedTargets = normalizeSyncTargets(targets);

  for (const target of normalizedTargets) {
    const relativePath = normalizeSyncTargetPath(target.path);
    const sourcePath = path.resolve(projectRoot, relativePath);
    const targetPath = path.resolve(worktreeRoot, relativePath);
    if (!isWithinRoot(projectRoot, sourcePath) || !isWithinRoot(worktreeRoot, targetPath)) {
      errors.push({ path: relativePath, message: "Invalid file path." });
      continue;
    }

    try {
      const sourceStats = await fsPromises.lstat(sourcePath);
      if (sourceStats.isDirectory()) {
        if (target.kind !== "directory") {
          errors.push({ path: relativePath, message: "Expected a file target." });
          continue;
        }

        const copiedPaths = await collectDirectoryReportPaths(projectRoot, sourcePath);
        await copyDirectoryTarget(sourcePath, targetPath);
        copied.push(...copiedPaths);
        continue;
      }

      if (!sourceStats.isFile() && !sourceStats.isSymbolicLink()) {
        errors.push({ path: relativePath, message: "Expected a file or symlink target." });
        continue;
      }

      await copyFileTarget(sourcePath, targetPath);
      copied.push(relativePath);
    } catch (error) {
      console.error(`Failed to copy ${relativePath}:`, error);
      const execError = error as ExecFileException & { stderr?: string };
      errors.push({
        path: relativePath,
        message: execError.stderr || execError.message || "Unknown copy error.",
      });
    }
  }

  return { success: errors.length === 0, copied, skipped, errors: errors.length > 0 ? errors : undefined };
};
