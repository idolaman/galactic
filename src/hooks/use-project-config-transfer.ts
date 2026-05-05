import type { WorkspaceIsolationManagerValue } from "@/hooks/workspace-isolation-manager-context";
import { useProjectConfigExport } from "@/hooks/use-project-config-export";
import { useProjectConfigImport } from "@/hooks/use-project-config-import";
import type { StoredProject } from "@/services/projects";

interface ProjectConfigTransferToast {
  error: (message: { title: string; description?: string }) => unknown;
  success: (message: { title: string; description?: string }) => unknown;
}

interface UseProjectConfigTransferOptions {
  selectedProject: StoredProject | null;
  appToast: ProjectConfigTransferToast;
  updateSelectedProject: (next: StoredProject) => void;
  workspaceIsolationTopologyForProject: WorkspaceIsolationManagerValue["workspaceIsolationTopologyForProject"];
  saveWorkspaceIsolationProjectTopology: WorkspaceIsolationManagerValue["saveWorkspaceIsolationProjectTopology"];
  deleteWorkspaceIsolationProjectTopology: WorkspaceIsolationManagerValue["deleteWorkspaceIsolationProjectTopology"];
}

export const useProjectConfigTransfer = ({
  selectedProject,
  appToast,
  updateSelectedProject,
  workspaceIsolationTopologyForProject,
  saveWorkspaceIsolationProjectTopology,
  deleteWorkspaceIsolationProjectTopology,
}: UseProjectConfigTransferOptions) => {
  const handleExportProjectConfig = useProjectConfigExport({
    selectedProject,
    appToast,
    workspaceIsolationTopologyForProject,
  });
  const projectConfigImport = useProjectConfigImport({
    selectedProject,
    appToast,
    updateSelectedProject,
    workspaceIsolationTopologyForProject,
    saveWorkspaceIsolationProjectTopology,
    deleteWorkspaceIsolationProjectTopology,
  });

  return {
    ...projectConfigImport,
    handleExportProjectConfig,
  };
};
