import { existsSync, mkdirSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";

const USERS_DIR_NAME = "users";
const MIGRATION_CLAIM_FILE_NAME = "migration-v1-claimed-by";
const CODE_WORKSPACE_EXTENSION = ".code-workspace";
export const WORKSPACE_CACHE_AUTH_REQUIRED_ERROR =
  "Workspace cache requires an active signed-in user.";

const normalizeUserId = (userId: string | null | undefined): string | null => {
  const normalized = userId?.trim();
  return normalized ? normalized : null;
};

const toUserStorageSegment = (userId: string): string =>
  encodeURIComponent(userId);

const isMissingFileError = (error: unknown): boolean =>
  (error as NodeJS.ErrnoException).code === "ENOENT";

export class UserScopedWorkspaceCache {
  private activeUserId: string | null = null;

  constructor(private readonly rootDir: string) {}

  async setActiveUser(userId: string): Promise<void> {
    const normalized = normalizeUserId(userId);
    if (!normalized) {
      throw new Error(WORKSPACE_CACHE_AUTH_REQUIRED_ERROR);
    }

    await this.claimLegacyMigration(normalized);
    this.activeUserId = normalized;
    await fs.mkdir(this.getUserCacheDir(normalized), { recursive: true });
  }

  clearActiveUser(): void {
    this.activeUserId = null;
  }

  getActiveCacheDir(): string | null {
    if (this.activeUserId) {
      return this.ensureDir(this.getUserCacheDir(this.activeUserId));
    }

    return null;
  }

  private getMigrationClaimPath(): string {
    return path.join(this.rootDir, MIGRATION_CLAIM_FILE_NAME);
  }

  private getUserCacheDir(userId: string): string {
    return path.join(this.rootDir, USERS_DIR_NAME, toUserStorageSegment(userId));
  }

  private ensureDir(dirPath: string): string {
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
    return dirPath;
  }

  private async claimLegacyMigration(userId: string): Promise<void> {
    await fs.mkdir(this.rootDir, { recursive: true });
    if (existsSync(this.getMigrationClaimPath())) {
      return;
    }

    const scopedDir = this.getUserCacheDir(userId);
    await fs.mkdir(scopedDir, { recursive: true });
    await this.copyLegacyWorkspaceFiles(scopedDir);
    await fs.writeFile(this.getMigrationClaimPath(), userId, "utf-8");
  }

  private async copyLegacyWorkspaceFiles(scopedDir: string): Promise<void> {
    let entries: string[];
    try {
      entries = await fs.readdir(this.rootDir);
    } catch (error) {
      if (!isMissingFileError(error)) {
        console.warn("Failed to read legacy workspace cache:", error);
      }
      return;
    }

    await Promise.all(
      entries
        .filter((entry) => entry.endsWith(CODE_WORKSPACE_EXTENSION))
        .map(async (entry) => {
          const legacyPath = path.join(this.rootDir, entry);
          const scopedPath = path.join(scopedDir, entry);
          if (existsSync(scopedPath)) {
            return;
          }
          try {
            const stats = await fs.stat(legacyPath);
            if (stats.isFile()) {
              await fs.copyFile(legacyPath, scopedPath);
            }
          } catch (error) {
            console.warn(`Failed to migrate workspace cache file ${entry}:`, error);
          }
        }),
    );
  }
}
