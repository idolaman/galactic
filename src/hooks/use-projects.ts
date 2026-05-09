import { useState, useEffect } from "react";
import { projectStorage, type StoredProject } from "@/services/projects";
import {
  LOCAL_STORAGE_SCOPE_UPDATED_EVENT,
  isActiveLocalStorageDatasetKey,
  isLocalStorageScopeKey,
} from "@/services/local-storage-scope";

export function useProjects() {
  const [projects, setProjects] = useState<StoredProject[]>(() => projectStorage.load());

  useEffect(() => {
    const handleUpdate = () => {
      setProjects(projectStorage.load());
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
