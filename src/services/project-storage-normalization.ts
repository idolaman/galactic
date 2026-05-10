import {
  normalizeSyncTargets,
  sanitizeSyncTarget,
  toFileSyncTargets,
} from "@/services/sync-targets";
import type { StoredProject } from "@/types/project";
import type { SyncTarget } from "@/types/sync-target";

const toValidSyncTargets = (project: StoredProject): SyncTarget[] => {
  if (Array.isArray(project.syncTargets)) {
    const cleanedTargets = project.syncTargets
      .map((target) => sanitizeSyncTarget(target))
      .filter((target): target is SyncTarget => Boolean(target));
    return normalizeSyncTargets(cleanedTargets);
  }

  return normalizeSyncTargets(toFileSyncTargets(project.configFiles));
};

const normalizeProject = (project: StoredProject): StoredProject | null => {
  if (!project || typeof project !== "object") {
    return null;
  }
  if (
    typeof project.id !== "string" ||
    typeof project.name !== "string" ||
    typeof project.path !== "string"
  ) {
    return null;
  }

  const worktreesValue = Number.isFinite(project.worktrees) ? project.worktrees : 0;
  return {
    id: project.id,
    name: project.name,
    path: project.path,
    isGitRepo: Boolean(project.isGitRepo),
    worktrees: Math.max(0, worktreesValue),
    workspaces: project.workspaces,
    syncTargets: toValidSyncTargets(project),
  };
};

export const normalizeProjects = (projects: StoredProject[]): StoredProject[] => {
  return projects
    .map((project) => normalizeProject(project))
    .filter((project): project is StoredProject => Boolean(project));
};
