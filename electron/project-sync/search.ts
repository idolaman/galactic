import { promises as fsPromises } from "node:fs";
import path from "node:path";
import { normalizeRelativePath } from "./path-utils.js";
import type { SyncTarget } from "./types.js";

const DEFAULT_IGNORED_DIRECTORIES = new Set([".git"]);
const DEFAULT_MAX_RESULTS = 250;

export interface SearchSyncTargetsOptions {
  ignoredDirectories?: Set<string>;
  maxResults?: number;
}

export const searchSyncTargetsInProject = async (
  projectPath: string,
  query: string,
  options: SearchSyncTargetsOptions = {},
): Promise<SyncTarget[]> => {
  const normalizedQuery = query.trim().toLowerCase();
  const ignoredDirectories = options.ignoredDirectories ?? DEFAULT_IGNORED_DIRECTORIES;
  const maxResults = options.maxResults ?? DEFAULT_MAX_RESULTS;
  const results: SyncTarget[] = [];
  const seen = new Set<string>();
  const stack: string[] = [projectPath];

  while (stack.length > 0 && results.length < maxResults) {
    const currentDir = stack.pop();
    if (!currentDir) {
      continue;
    }

    let entries: import("node:fs").Dirent[];
    try {
      entries = await fsPromises.readdir(currentDir, { withFileTypes: true });
    } catch (error) {
      console.warn(`Unable to read directory ${currentDir}:`, error);
      continue;
    }

    for (const entry of entries) {
      const entryPath = path.join(currentDir, entry.name);
      const relativePath = normalizeRelativePath(projectPath, entryPath);
      if (!relativePath || relativePath.startsWith("..")) {
        continue;
      }

      const isMatch = !normalizedQuery || relativePath.toLowerCase().includes(normalizedQuery);
      if (entry.isDirectory()) {
        if (ignoredDirectories.has(entry.name)) {
          continue;
        }

        if (isMatch) {
          const key = `directory:${relativePath}`;
          if (!seen.has(key)) {
            results.push({ path: relativePath, kind: "directory" });
            seen.add(key);
            if (results.length >= maxResults) {
              break;
            }
          }
        }

        stack.push(entryPath);
        continue;
      }

      if (isMatch && (entry.isFile() || entry.isSymbolicLink())) {
        const key = `file:${relativePath}`;
        if (!seen.has(key)) {
          results.push({ path: relativePath, kind: "file" });
          seen.add(key);
          if (results.length >= maxResults) {
            break;
          }
        }
      }
    }
  }

  return results.sort((left, right) => {
    if (left.kind !== right.kind) {
      return left.kind === "directory" ? -1 : 1;
    }
    return left.path.localeCompare(right.path);
  });
};
