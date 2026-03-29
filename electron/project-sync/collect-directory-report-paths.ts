import { promises as fsPromises } from "node:fs";
import path from "node:path";
import { isWithinRoot, normalizeRelativePath } from "./path-utils.js";

export const collectDirectoryReportPaths = async (
  projectRoot: string,
  startPath: string,
): Promise<string[]> => {
  const collectedPaths: string[] = [];
  const stack: string[] = [startPath];

  while (stack.length > 0) {
    const currentDir = stack.pop();
    if (!currentDir) {
      continue;
    }

    const entries = await fsPromises.readdir(currentDir, { withFileTypes: true });
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
          collectedPaths.push(relativePath);
        }
      }
    }
  }

  return collectedPaths.sort((left, right) => left.localeCompare(right));
};
