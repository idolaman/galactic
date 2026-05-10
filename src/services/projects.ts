import { trackProjectAdded, trackProjectRemoved } from "@/services/analytics";
import {
  PRODUCT_STORAGE_UNAVAILABLE_ERROR,
  getLocalStorage,
  getProductStorageKey,
} from "@/services/local-storage-scope";
import { normalizeProjects } from "@/services/project-storage-normalization";
import type { StoredProject } from "@/types/project";

export type { StoredProject } from "@/types/project";

const STORAGE_DATASET = "projects";
const serializeProjects = (projects: StoredProject[]): string =>
  JSON.stringify(normalizeProjects(projects));

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
  const storage = getLocalStorage();
  const storageKey = getProductStorageKey(STORAGE_DATASET);
  if (!storage) throw new Error(PRODUCT_STORAGE_UNAVAILABLE_ERROR);
  return normalizeProjects(safeParse(storage.getItem(storageKey)));
};

const writeAll = (projects: StoredProject[]): void => {
  const storage = getLocalStorage();
  const storageKey = getProductStorageKey(STORAGE_DATASET);
  if (!storage) throw new Error(PRODUCT_STORAGE_UNAVAILABLE_ERROR);
  try {
    storage.setItem(storageKey, serializeProjects(projects));
  } catch (error) {
    console.warn("Failed to save projects:", error);
    throw error;
  }
};

const dispatchChange = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("galactic-projects-updated"));
  }
};

export const projectStorage = {
  load(): StoredProject[] {
    const storage = getLocalStorage();
    const storageKey = getProductStorageKey(STORAGE_DATASET);
    if (!storage) throw new Error(PRODUCT_STORAGE_UNAVAILABLE_ERROR);
    const raw = storage.getItem(storageKey);
    const projects = normalizeProjects(safeParse(raw));
    const normalized = serializeProjects(projects);
    if (raw !== normalized) {
      storage.setItem(storageKey, normalized);
    }
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
    }
    writeAll(nextProjects);
    dispatchChange();
    if (existingIndex < 0) {
      trackProjectAdded(project.isGitRepo, project.worktrees ?? 0);
    }
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
