import { useCallback, useState } from "react";
import type { WorkspaceIsolationManagerValue } from "@/hooks/workspace-isolation-manager-context";
import {
  buildProjectConfigImportReview,
  type ProjectConfigImportReview,
} from "@/lib/project-config-import-review";
import { applyProjectConfigImport } from "@/lib/project-config-import-apply";
import {
  buildProjectConfigImportAction,
  parseProjectConfigManifest,
} from "@/lib/project-config";
import { importProjectConfigFile } from "@/services/project-config-files";
import type { StoredProject } from "@/services/projects";

interface ProjectConfigImportToast {
  error: (message: { title: string; description?: string }) => unknown;
  success: (message: { title: string; description?: string }) => unknown;
}

interface UseProjectConfigImportOptions {
  selectedProject: StoredProject | null;
  appToast: ProjectConfigImportToast;
  updateSelectedProject: (next: StoredProject) => void;
  workspaceIsolationTopologyForProject: WorkspaceIsolationManagerValue["workspaceIsolationTopologyForProject"];
  saveWorkspaceIsolationProjectTopology: WorkspaceIsolationManagerValue["saveWorkspaceIsolationProjectTopology"];
  deleteWorkspaceIsolationProjectTopology: WorkspaceIsolationManagerValue["deleteWorkspaceIsolationProjectTopology"];
}

interface PendingProjectConfigImport {
  project: StoredProject;
  review: ProjectConfigImportReview;
}

export const useProjectConfigImport = ({
  selectedProject,
  appToast,
  updateSelectedProject,
  workspaceIsolationTopologyForProject,
  saveWorkspaceIsolationProjectTopology,
  deleteWorkspaceIsolationProjectTopology,
}: UseProjectConfigImportOptions) => {
  const [pendingImport, setPendingImport] = useState<PendingProjectConfigImport | null>(null);
  const [isApplyingProjectConfigImport, setIsApplyingProjectConfigImport] = useState(false);

  const handleImportProjectConfig = useCallback(async () => {
    if (!selectedProject?.isGitRepo) return;
    const projectSnapshot = selectedProject;
    const result = await importProjectConfigFile();
    if (result.canceled) return;
    if (!result.success) {
      appToast.error({
        title: "Project config import failed",
        description: result.error ?? "Unable to read the project config file.",
      });
      return;
    }

    try {
      const action = buildProjectConfigImportAction(
        parseProjectConfigManifest(result.payload),
        projectSnapshot,
      );
      setPendingImport({
        project: projectSnapshot,
        review: buildProjectConfigImportReview({
          action,
          currentSyncTargets: projectSnapshot.syncTargets ?? [],
          currentTopology: workspaceIsolationTopologyForProject(projectSnapshot.id),
        }),
      });
    } catch (error) {
      appToast.error({
        title: "Project config import failed",
        description:
          error instanceof Error ? error.message : "Unable to apply the project config.",
      });
    }
  }, [appToast, selectedProject, workspaceIsolationTopologyForProject]);

  const handleCancelProjectConfigImport = useCallback(() => {
    if (!isApplyingProjectConfigImport) setPendingImport(null);
  }, [isApplyingProjectConfigImport]);

  const handleConfirmProjectConfigImport = useCallback(async () => {
    if (!pendingImport || isApplyingProjectConfigImport) return;
    setIsApplyingProjectConfigImport(true);
    try {
      await applyProjectConfigImport({
        project: pendingImport.project,
        review: pendingImport.review,
        currentTopology: workspaceIsolationTopologyForProject(pendingImport.project.id),
        saveProjectTopology: saveWorkspaceIsolationProjectTopology,
        deleteProjectTopology: deleteWorkspaceIsolationProjectTopology,
        updateProject: updateSelectedProject,
      });
      setPendingImport(null);
      appToast.success({ title: "Project config imported" });
    } catch (error) {
      appToast.error({
        title: "Project config import failed",
        description:
          error instanceof Error ? error.message : "Unable to apply the project config.",
      });
    } finally {
      setIsApplyingProjectConfigImport(false);
    }
  }, [
    appToast,
    deleteWorkspaceIsolationProjectTopology,
    isApplyingProjectConfigImport,
    pendingImport,
    saveWorkspaceIsolationProjectTopology,
    updateSelectedProject,
    workspaceIsolationTopologyForProject,
  ]);

  return {
    importReview: pendingImport?.review ?? null,
    isApplyingProjectConfigImport,
    handleCancelProjectConfigImport,
    handleConfirmProjectConfigImport,
    handleImportProjectConfig,
  };
};
