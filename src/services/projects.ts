import type { Workspace } from "@/types/workspace";
import { trackProjectAdded, trackProjectRemoved } from "@/services/analytics";
import {
  dedupeSyncTargets,
  sanitizeSyncTarget,
  toFileSyncTargets,
} from "@/services/sync-targets";
import type { SyncTarget } from "@/types/sync-target";

export interface StoredProject {
  id: string;
  name: string;
  path: string;
  isGitRepo: boolean;
  worktrees: number;
  workspaces?: Workspace[];
  syncTargets?: SyncTarget[];
  // Legacy persisted field kept for compatibility with older app versions.
  configFiles?: string[];
}

const STORAGE_KEY = "galactic-ide:projects";

const getStorage = (): Storage | null => {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return null;
  }
  return window.localStorage;
};

const safeParse = (raw: string | null): StoredProject[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Failed to parse stored projects:", error);
    return [];
  }
};

const toValidSyncTargets = (project: StoredProject): SyncTarget[] => {
  if (Array.isArray(project.syncTargets)) {
    const cleanedTargets = project.syncTargets
      .map((target) => sanitizeSyncTarget(target))
      .filter((target): target is SyncTarget => Boolean(target));
    return dedupeSyncTargets(cleanedTargets);
  }

  return dedupeSyncTargets(toFileSyncTargets(project.configFiles));
};

const normalizeProject = (project: StoredProject): StoredProject | null => {
  if (!project || typeof project !== "object") {
    return null;
  }
  if (typeof project.id !== "string" || typeof project.name !== "string" || typeof project.path !== "string") {
    return null;
  }

  const worktreesValue = Number.isFinite(project.worktrees) ? Number(project.worktrees) : 0;
  const normalized: StoredProject = {
    id: project.id,
    name: project.name,
    path: project.path,
    isGitRepo: Boolean(project.isGitRepo),
    worktrees: Math.max(0, worktreesValue),
    workspaces: project.workspaces,
    syncTargets: toValidSyncTargets(project),
  };

  return normalized;
};

const normalizeProjects = (projects: StoredProject[]): StoredProject[] => {
  return projects
    .map((project) => normalizeProject(project))
    .filter((project): project is StoredProject => Boolean(project));
};

const readAll = (): StoredProject[] => {
  const storage = getStorage();
  if (!storage) return [];
  return normalizeProjects(safeParse(storage.getItem(STORAGE_KEY)));
};

const writeAll = (projects: StoredProject[]): void => {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(normalizeProjects(projects)));
  } catch (error) {
    console.warn("Failed to save projects:", error);
  }
};

const dispatchChange = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("galactic-projects-updated"));
  }
};

export const projectStorage = {
  load(): StoredProject[] {
    const projects = readAll();
    writeAll(projects);
    return projects;
  },
  save(projects: StoredProject[]): void {
    writeAll(projects);
    dispatchChange();
  },
  upsert(project: StoredProject): StoredProject[] {
    const nextProjects = [...readAll()];
    const existingIndex = nextProjects.findIndex((item) => item.id === project.id);
    if (existingIndex >= 0) {
      nextProjects[existingIndex] = project;
    } else {
      nextProjects.unshift(project);
      trackProjectAdded(project.isGitRepo, project.worktrees ?? 0);
    }
    writeAll(nextProjects);
    dispatchChange();
    return nextProjects;
  },
  remove(projectId: string): StoredProject[] {
    const currentProjects = readAll();
    const removedProject = currentProjects.find((project) => project.id === projectId);
    const nextProjects = currentProjects.filter((project) => project.id !== projectId);
    writeAll(nextProjects);
    dispatchChange();
    if (removedProject) {
      trackProjectRemoved(
        removedProject.worktrees ?? 0,
        removedProject.syncTargets?.length ?? removedProject.configFiles?.length ?? 0,
      );
    }
    return nextProjects;
  },
};
