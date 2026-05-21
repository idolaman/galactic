import path from "node:path";

export const getWorkspaceConsoleLabel = (
  workspacePath: string,
  workspaceLabel?: string,
): string => {
  const trimmedLabel = workspaceLabel?.trim();
  if (trimmedLabel) {
    return trimmedLabel;
  }

  return path.basename(path.resolve(workspacePath)) || "Workspace";
};

export const isPathInsideWorkspace = (
  workspacePath: string,
  candidatePath: string,
): boolean => {
  const workspaceRoot = path.resolve(workspacePath);
  const candidate = path.resolve(candidatePath);
  const relativePath = path.relative(workspaceRoot, candidate);

  return (
    relativePath === "" ||
    (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))
  );
};

export const resolveWorkspaceConsoleCwd = (
  workspacePath: string,
  cwd?: string,
): { success: true; cwd: string } | { success: false; error: string } => {
  const workspaceRoot = path.resolve(workspacePath);
  const resolvedCwd = cwd ? path.resolve(cwd) : workspaceRoot;

  if (!isPathInsideWorkspace(workspaceRoot, resolvedCwd)) {
    return {
      success: false,
      error: "Terminal cwd must stay inside the workspace.",
    };
  }

  return { success: true, cwd: resolvedCwd };
};
