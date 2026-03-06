import type { Workspace } from "../types/workspace.js";

interface ProjectWorkspaces {
  path: string;
  worktrees: number;
  workspaces?: Workspace[];
}

interface GitWorktreeSnapshot {
  path: string;
  branch: string;
}

const normalizePath = (value: string): string => value.replace(/[\\/]+$/, "");

const areWorkspaceListsEqual = (left: Workspace[], right: Workspace[]): boolean => {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((workspace, index) => {
    const candidate = right[index];
    return workspace.name === candidate?.name && workspace.workspace === candidate?.workspace;
  });
};

export const toAdditionalWorkspaces = (
  projectPath: string,
  worktrees: GitWorktreeSnapshot[],
): Workspace[] => {
  const normalizedProjectPath = normalizePath(projectPath);
  return worktrees
    .filter((worktree) => normalizePath(worktree.path) !== normalizedProjectPath)
    .map((worktree) => ({
      name: worktree.branch,
      workspace: worktree.path,
    }));
};

export const reconcileProjectWorkspaces = <T extends ProjectWorkspaces>(
  project: T,
  worktrees: GitWorktreeSnapshot[],
): T => {
  const liveWorkspaces = toAdditionalWorkspaces(project.path, worktrees);
  const currentWorkspaces = project.workspaces ?? [];
  const didCountChange = project.worktrees !== liveWorkspaces.length;
  const didListChange = !areWorkspaceListsEqual(currentWorkspaces, liveWorkspaces);

  if (!didCountChange && !didListChange) {
    return project;
  }

  return {
    ...project,
    worktrees: liveWorkspaces.length,
    workspaces: liveWorkspaces,
  };
};
