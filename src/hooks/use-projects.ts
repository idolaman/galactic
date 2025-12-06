import { useState, useEffect } from "react";
import { projectStorage, type StoredProject } from "@/services/projects";

export function useProjects() {
  const [projects, setProjects] = useState<StoredProject[]>(() => projectStorage.load());

  useEffect(() => {
    const handleUpdate = () => {
      setProjects(projectStorage.load());
    };

    window.addEventListener("galactic-projects-updated", handleUpdate);
    // Also listen to storage events for multi-tab sync if needed, 
    // though projectStorage writes to localStorage which triggers 'storage' event in OTHER tabs only.
    window.addEventListener("storage", (e) => {
      if (e.key === "galactic-ide:projects") {
        handleUpdate();
      }
    });

    return () => {
      window.removeEventListener("galactic-projects-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate); // storage listener needs exact handler reference if possible or wrapper
    };
  }, []);

  return projects;
}

