import type { Workspace } from "@/types/workspace";

export interface StoredProject {
  id: string;
  name: string;
  path: string;
  isGitRepo: boolean;
  currentBranch?: string | null;
  worktrees: number;
  workspaces?: Workspace[];
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

const readAll = (): StoredProject[] => {
  const storage = getStorage();
  if (!storage) return [];
  return safeParse(storage.getItem(STORAGE_KEY));
};

const writeAll = (projects: StoredProject[]): void => {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (error) {
    console.warn("Failed to save projects:", error);
  }
};

export const projectStorage = {
  load(): StoredProject[] {
    return readAll();
  },
  save(projects: StoredProject[]): void {
    writeAll(projects);
  },
  upsert(project: StoredProject): StoredProject[] {
    const nextProjects = [...readAll()];
    const existingIndex = nextProjects.findIndex((item) => item.id === project.id);
    if (existingIndex >= 0) {
      nextProjects[existingIndex] = project;
    } else {
      nextProjects.unshift(project);
    }
    writeAll(nextProjects);
    return nextProjects;
  },
  remove(projectId: string): StoredProject[] {
    const nextProjects = readAll().filter((project) => project.id !== projectId);
    writeAll(nextProjects);
    return nextProjects;
  },
};
