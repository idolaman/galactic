import { useCallback } from "react";
import type { WorkspaceIsolationManagerValue } from "@/hooks/workspace-isolation-manager-context";
import {
  buildProjectConfigManifest,
  getProjectConfigDefaultFileName,
} from "@/lib/project-config";
import { exportProjectConfigFile } from "@/services/project-config-files";
import type { StoredProject } from "@/services/projects";

interface ProjectConfigExportToast {
  error: (message: { title: string; description?: string }) => unknown;
  success: (message: { title: string; description?: string }) => unknown;
}

interface UseProjectConfigExportOptions {
  selectedProject: StoredProject | null;
  appToast: ProjectConfigExportToast;
  workspaceIsolationTopologyForProject: WorkspaceIsolationManagerValue["workspaceIsolationTopologyForProject"];
}

export const useProjectConfigExport = ({
  selectedProject,
  appToast,
  workspaceIsolationTopologyForProject,
}: UseProjectConfigExportOptions) =>
  useCallback(async () => {
    if (!selectedProject?.isGitRepo) {
      return;
    }

    const result = await exportProjectConfigFile({
      defaultFileName: getProjectConfigDefaultFileName(selectedProject.name),
      payload: buildProjectConfigManifest({
        syncTargets: selectedProject.syncTargets ?? [],
        projectServices: workspaceIsolationTopologyForProject(selectedProject.id),
      }),
    });

    if (result.canceled) {
      return;
    }
    if (!result.success) {
      appToast.error({
        title: "Project config export failed",
        description: result.error ?? "Unable to write the project config file.",
      });
      return;
    }
    appToast.success({ title: "Project config exported" });
  }, [appToast, selectedProject, workspaceIsolationTopologyForProject]);
