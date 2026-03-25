import { promises as fsPromises } from "node:fs";

export const pathExists = async (entryPath: string): Promise<boolean> => {
  try {
    await fsPromises.lstat(entryPath);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }
    throw error;
  }
};

const resolveWindowsSymlinkType = async (sourcePath: string): Promise<"file" | "dir"> => {
  try {
    const stats = await fsPromises.stat(sourcePath);
    return stats.isDirectory() ? "dir" : "file";
  } catch {
    return "file";
  }
};

export const copyEntry = async (sourcePath: string, targetPath: string): Promise<void> => {
  const sourceStats = await fsPromises.lstat(sourcePath);
  if (!sourceStats.isSymbolicLink()) {
    await fsPromises.copyFile(sourcePath, targetPath);
    return;
  }

  const linkTarget = await fsPromises.readlink(sourcePath);
  const linkType = process.platform === "win32" ? await resolveWindowsSymlinkType(sourcePath) : undefined;
  await fsPromises.symlink(linkTarget, targetPath, linkType);
};
