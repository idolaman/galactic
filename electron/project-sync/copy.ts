import { existsSync, promises as fsPromises } from "node:fs";
import path from "node:path";
import {
  isWithinRoot,
  normalizeRelativePath,
  normalizeSyncTargetPath,
} from "./path-utils.js";
import type { CopySyncTargetError, CopySyncTargetsResult, SyncTarget } from "./types.js";

const collectDirectoryFiles = async (
  projectRoot: string,
  startPath: string,
  errors: CopySyncTargetError[],
): Promise<string[]> => {
  const collectedFiles: string[] = [];
  const stack: string[] = [startPath];

  while (stack.length > 0) {
    const currentDir = stack.pop();
    if (!currentDir) {
      continue;
    }

    let entries: import("node:fs").Dirent[];
    try {
      entries = await fsPromises.readdir(currentDir, { withFileTypes: true });
    } catch (error) {
      const relativeDir = normalizeRelativePath(projectRoot, currentDir);
      errors.push({ path: relativeDir || ".", message: error instanceof Error ? error.message : "Unknown read error." });
      continue;
    }

    for (const entry of entries) {
      const entryPath = path.join(currentDir, entry.name);
      if (!isWithinRoot(projectRoot, entryPath)) {
        continue;
      }

      if (entry.isDirectory()) {
        stack.push(entryPath);
        continue;
      }

      if (entry.isFile() || entry.isSymbolicLink()) {
        const relativePath = normalizeRelativePath(projectRoot, entryPath);
        if (relativePath && !relativePath.startsWith("..")) {
          collectedFiles.push(relativePath);
        }
      }
    }
  }

  return collectedFiles;
};

const collectTargetFilePaths = async (
  projectRoot: string,
  targets: SyncTarget[],
  errors: CopySyncTargetError[],
): Promise<string[]> => {
  const filePaths = new Set<string>();

  for (const target of targets) {
    const relativePath = normalizeSyncTargetPath(target.path);
    const sourcePath = path.resolve(projectRoot, relativePath);
    if (!relativePath || !isWithinRoot(projectRoot, sourcePath)) {
      errors.push({ path: target.path, message: "Invalid sync path." });
      continue;
    }

    let stats: import("node:fs").Stats;
    try {
      stats = await fsPromises.stat(sourcePath);
    } catch (error) {
      errors.push({ path: relativePath, message: error instanceof Error ? error.message : "Source path does not exist." });
      continue;
    }

    if (target.kind === "directory") {
      if (!stats.isDirectory()) {
        errors.push({ path: relativePath, message: "Expected a directory target." });
        continue;
      }
      const nestedFiles = await collectDirectoryFiles(projectRoot, sourcePath, errors);
      nestedFiles.forEach((file) => filePaths.add(file));
      continue;
    }

    if (!stats.isFile() && !stats.isSymbolicLink()) {
      errors.push({ path: relativePath, message: "Expected a file target." });
      continue;
    }
    filePaths.add(relativePath);
  }

  return [...filePaths];
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
  const filePaths = await collectTargetFilePaths(projectRoot, targets, errors);

  for (const relativePath of filePaths) {
    const sourcePath = path.resolve(projectRoot, relativePath);
    const targetPath = path.resolve(worktreeRoot, relativePath);
    if (!isWithinRoot(projectRoot, sourcePath) || !isWithinRoot(worktreeRoot, targetPath)) {
      errors.push({ path: relativePath, message: "Invalid file path." });
      continue;
    }
    if (existsSync(targetPath)) {
      skipped.push(relativePath);
      continue;
    }

    try {
      await fsPromises.mkdir(path.dirname(targetPath), { recursive: true });
      await fsPromises.copyFile(sourcePath, targetPath);
      copied.push(relativePath);
    } catch (error) {
      console.error(`Failed to copy ${relativePath}:`, error);
      errors.push({ path: relativePath, message: error instanceof Error ? error.message : "Unknown copy error." });
    }
  }

  return { success: errors.length === 0, copied, skipped, errors: errors.length > 0 ? errors : undefined };
};
