import { useState, useEffect } from "react";
import { loadProjectsForActiveScope } from "@/lib/project-list-state";
import { projectStorage, type StoredProject } from "@/services/projects";
import {
  getActiveLocalStorageUserId,
  LOCAL_STORAGE_SCOPE_UPDATED_EVENT,
  isActiveLocalStorageDatasetKey,
  isLocalStorageScopeKey,
} from "@/services/local-storage-scope";

const loadProjects = (): StoredProject[] =>
  loadProjectsForActiveScope({
    getActiveUserId: getActiveLocalStorageUserId,
    loadProjects: projectStorage.load,
  });

export function useProjects() {
  const [projects, setProjects] = useState<StoredProject[]>(loadProjects);

  useEffect(() => {
    const handleUpdate = () => {
      setProjects(loadProjects());
    };
    const handleStorage = (event: StorageEvent) => {
      if (
        isLocalStorageScopeKey(event.key) ||
        isActiveLocalStorageDatasetKey(event.key, "projects")
      ) {
        handleUpdate();
      }
    };

    window.addEventListener("galactic-projects-updated", handleUpdate);
    window.addEventListener(LOCAL_STORAGE_SCOPE_UPDATED_EVENT, handleUpdate);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("galactic-projects-updated", handleUpdate);
      window.removeEventListener(LOCAL_STORAGE_SCOPE_UPDATED_EVENT, handleUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return projects;
}
