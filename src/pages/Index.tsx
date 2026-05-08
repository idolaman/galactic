import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ProjectList } from "@/components/ProjectList";
import { ProjectDetail } from "@/components/ProjectDetail";
import { ProjectConfigImportReviewDialog } from "@/components/ProjectConfigImportReviewDialog";
import { useAppToast } from "@/hooks/use-app-toast";
import { useBranchLoader } from "@/hooks/use-branch-loader";
import { useProjectConfigTransfer } from "@/hooks/use-project-config-transfer";
import { useWorkspaceIsolationManager } from "@/hooks/use-workspace-isolation-manager";
import { chooseProjectDirectory } from "@/services/os";
import {
  createWorktree,
  getGitInfo,
  removeWorktree,
  getWorktrees,
} from "@/services/git";
import { projectStorage, type StoredProject } from "@/services/projects";
import { getPreferredEditor, openProjectInEditor } from "@/services/editor";
import type { Workspace } from "@/types/workspace";
import {
  copyProjectSyncTargetsToWorktree,
  searchProjectSyncTargets,
} from "@/services/files";
import { useEnvironmentManager } from "@/hooks/use-environment-manager";
import type { EnvironmentBinding } from "@/types/environment";
import {
  writeCodeWorkspace,
  getCodeWorkspacePath,
  deleteCodeWorkspace,
} from "@/services/workspace";
import {
  clearWorkspaceRelaunchFlag,
  ensureLaunchedEnvironment,
} from "@/services/workspace-state";
import { trackConfigFileAdded } from "@/services/analytics";
import {
  includesSyncTarget,
  isSameSyncTarget,
  normalizeSyncTargetPath,
  normalizeSyncTargets,
} from "@/services/sync-targets";
import {
  DEFAULT_CREATE_WORKSPACE_COMMAND_ERROR,
  DEFAULT_CREATE_WORKSPACE_UNKNOWN_ERROR,
  getCreateWorkspaceFailureToast,
} from "@/lib/create-workspace-toast";
import {
  evaluateWorktreeRemovalResult,
  getWorktreeRemovalFailureToast,
  getWorktreeRemovalLoadingToast,
} from "@/lib/worktree-removal";
import { reconcileProjectWorkspaces, toAdditionalWorkspaces } from "@/lib/workspace-reconciliation";
import type { CreateWorkspaceRequest } from "@/lib/create-workspace-request";
import type { SyncTarget } from "@/types/sync-target";

type Project = StoredProject;

const Index = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const appToast = useAppToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>(() =>
    projectStorage.load(),
  );
  const [projectBranches, setProjectBranches] = useState<string[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [projectWorkspaces, setProjectWorkspaces] = useState<
    Record<string, Workspace[]>
  >(() => {
    const loaded = projectStorage.load();
    return loaded.reduce(
      (acc, project) => {
        acc[project.id] = project.workspaces ?? [];
        return acc;
      },
      {} as Record<string, Workspace[]>,
    );
  });
  const [syncTargetSearchResults, setSyncTargetSearchResults] = useState<
    SyncTarget[]
  >([]);
  const [isSearchingSyncTargets, setIsSearchingSyncTargets] = useState(false);
  const { environments, assignTarget, unassignTarget, environmentForTarget } =
    useEnvironmentManager();
  const {
    deleteWorkspaceIsolationForProject,
    deleteWorkspaceIsolationProjectTopology,
    disableWorkspaceIsolationForWorkspace,
    saveWorkspaceIsolationProjectTopology,
    workspaceIsolationTopologyForProject,
  } =
    useWorkspaceIsolationManager();
  const { loadProjectBranches } = useBranchLoader({
    setIsLoadingBranches,
    setProjectBranches,
    showToast: appToast.show,
  });

  const handleAddProject = async () => {
    const projectPath = await chooseProjectDirectory();

    if (!projectPath) {
      return;
    }

    const normalizedPath = projectPath.replace(/\/+$/, "");
    const pathSegments = normalizedPath.split(/[\\/]/).filter(Boolean);
    const projectName = pathSegments[pathSegments.length - 1] || normalizedPath;

    const gitInfo = await getGitInfo(normalizedPath);
    let detectedWorkspaces: Workspace[] = [];
    let detectedWorktrees = 0;

    if (gitInfo.isGitRepo) {
      const worktrees = await getWorktrees(normalizedPath);
      detectedWorkspaces = toAdditionalWorkspaces(normalizedPath, worktrees);
      detectedWorktrees = detectedWorkspaces.length;

      // Create .code-workspace files for detected worktrees
      for (const ws of detectedWorkspaces) {
        unassignTarget(ws.workspace);
        await writeCodeWorkspace(ws.workspace, null);
        clearWorkspaceRelaunchFlag(ws.workspace);
      }
    }

    const newProject: Project = {
      id: normalizedPath,
      name: projectName,
      path: normalizedPath,
      isGitRepo: gitInfo.isGitRepo,
      worktrees: detectedWorktrees,
      workspaces: detectedWorkspaces,
      syncTargets: [],
    };

    setProjects(projectStorage.upsert(newProject));
    setProjectWorkspaces((prev) => ({
      ...prev,
      [newProject.id]: newProject.workspaces ?? [],
    }));

    // Clear any existing environment binding and create .code-workspace without env vars.
    // New projects start "clean", so no relaunch is required yet.
    unassignTarget(normalizedPath);
    await writeCodeWorkspace(normalizedPath, null);
    clearWorkspaceRelaunchFlag(normalizedPath);

    setSelectedProject(newProject);
  };

  const handleViewProject = useCallback(
    (project: Project) => {
      const workspaces =
        projectWorkspaces[project.id] ?? project.workspaces ?? [];
      setProjectWorkspaces((prev) => {
        if (prev[project.id]) {
          return prev;
        }

        return {
          ...prev,
          [project.id]: workspaces,
        };
      });

      setSelectedProject({ ...project, workspaces });
      setProjectBranches([]);
    },
    [projectWorkspaces],
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const projectId = params.get("project");
    if (!projectId) {
      return;
    }

    const targetProject = projects.find((project) => project.id === projectId);
    if (targetProject) {
      handleViewProject(targetProject);
    }

    params.delete("project");
    const nextSearch = params.toString();
    navigate(
      {
        pathname: "/",
        search: nextSearch ? `?${nextSearch}` : "",
      },
      { replace: true },
    );
  }, [handleViewProject, location.search, navigate, projects]);

  useEffect(() => {
    if (!selectedProject?.isGitRepo) {
      return;
    }

    let cancelled = false;
    const projectSnapshot = selectedProject;

    const reconcileWorkspaces = async () => {
      const liveWorktrees = await getWorktrees(projectSnapshot.path);
      const reconciledProject = reconcileProjectWorkspaces(projectSnapshot, liveWorktrees);

      if (cancelled || reconciledProject === projectSnapshot) {
        return;
      }

      const nextWorkspaces = reconciledProject.workspaces ?? [];
      setProjectWorkspaces((prev) => ({ ...prev, [projectSnapshot.id]: nextWorkspaces }));
      setSelectedProject((prev) => {
        if (!prev || prev.id !== projectSnapshot.id) {
          return prev;
        }
        return {
          ...prev,
          worktrees: reconciledProject.worktrees,
          workspaces: nextWorkspaces,
        };
      });
      setProjects((prevProjects) => {
        const updatedProjects = prevProjects.map((project) =>
          project.id === projectSnapshot.id
            ? { ...project, worktrees: reconciledProject.worktrees, workspaces: nextWorkspaces }
            : project,
        );
        projectStorage.save(updatedProjects);
        return updatedProjects;
      });
    };

    void reconcileWorkspaces();

    return () => {
      cancelled = true;
    };
  }, [selectedProject]);

  const handleDeleteProject = (projectId: string) => {
    const projectToDelete = projects.find(
      (project) => project.id === projectId,
    );
    if (!projectToDelete) {
      return;
    }

    if (selectedProject?.id === projectId) {
      setSelectedProject(null);
    }

    setProjects(projectStorage.remove(projectId));
    setProjectWorkspaces((prev) => {
      const next = { ...prev };
      delete next[projectId];
      return next;
    });

    // Clean up project-scoped isolation once for the whole project.
    void deleteWorkspaceIsolationForProject(projectId).catch((error) => {
      console.error(
        `Failed to delete Project Services for project ${projectId}:`,
        error,
      );
    });
    unassignTarget(projectToDelete.path);
    deleteCodeWorkspace(projectToDelete.path).catch((err) =>
      console.error("Failed to delete project workspace file:", err),
    );
    clearWorkspaceRelaunchFlag(projectToDelete.path);

    // Clean up any associated worktree workspaces
    const workspacesToDelete =
      projectWorkspaces[projectId] ?? projectToDelete.workspaces ?? [];
    workspacesToDelete.forEach((ws) => {
      unassignTarget(ws.workspace);
      deleteCodeWorkspace(ws.workspace).catch((err) =>
        console.error(`Failed to delete workspace file for ${ws.name}:`, err),
      );
      clearWorkspaceRelaunchFlag(ws.workspace);
    });
  };

  const handleCreateWorkspace = async (request: CreateWorkspaceRequest) => {
    if (!selectedProject) {
      return false;
    }

    const branch = request.branch.trim();
    if (!branch) {
      return false;
    }

    setIsCreatingWorkspace(true);
    const createWorkspaceToast = appToast.loading({
      title: "Creating workspace...",
    });

    try {
      const syncTargets = selectedProject.syncTargets ?? [];
      let syncWarningDescription: string | null = null;
      const result = await createWorktree(selectedProject.path, branch, {
        createBranch: request.createBranch,
        startPoint: request.startPoint,
      });

      if (!result.success || !result.path) {
        createWorkspaceToast.error(
          getCreateWorkspaceFailureToast({
            errorMessage: result.error,
            fallbackDescription: DEFAULT_CREATE_WORKSPACE_COMMAND_ERROR,
          }),
        );
        return false;
      }

      if (syncTargets.length > 0 && result.path) {
        createWorkspaceToast.update({
          title: "Syncing selected files and folders...",
        });
        const copyResult = await copyProjectSyncTargetsToWorktree(
          selectedProject.path,
          result.path,
          syncTargets,
        );
        if (!copyResult.success) {
          syncWarningDescription =
            copyResult.errors?.map((entry) => `${entry.path}: ${entry.message}`).join("\n") ??
            "Unable to sync selected files and folders.";
        }
      }

      createWorkspaceToast.update({ title: "Finalizing workspace..." });
      // Clear any existing environment binding and create .code-workspace without env vars.
      // Fresh worktrees also start clean.
      unassignTarget(result.path!);
      await writeCodeWorkspace(result.path, null);
      clearWorkspaceRelaunchFlag(result.path!);

      setProjectWorkspaces((prev) => {
        const next = { ...prev };
        const list = next[selectedProject.id]
          ? [...next[selectedProject.id]]
          : [];
        const nextWorkspace: Workspace = {
          name: branch,
          workspace: result.path!,
        };
        list.push(nextWorkspace);
        next[selectedProject.id] = list;

        const updatedProject: Project = {
          ...selectedProject,
          worktrees: (selectedProject.worktrees ?? 0) + 1,
          workspaces: list,
        };

        setSelectedProject(updatedProject);
        setProjects((prevProjects) => {
          const updatedProjects = prevProjects.map((project) =>
            project.id === updatedProject.id ? updatedProject : project,
          );
          projectStorage.save(updatedProjects);
          return updatedProjects;
        });

        return next;
      });

      createWorkspaceToast.success({
        title: "Workspace created!",
      });
      if (syncWarningDescription) {
        appToast.info({
          title: "Workspace sync incomplete",
          description: syncWarningDescription,
        });
      }

      return true;
    } catch (error) {
      createWorkspaceToast.error(
        getCreateWorkspaceFailureToast({
          errorMessage: error instanceof Error ? error.message : undefined,
          fallbackDescription: DEFAULT_CREATE_WORKSPACE_UNKNOWN_ERROR,
        }),
      );
      return false;
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  const handleDeleteWorkspace = async (workspacePath: string, branchName: string) => {
    if (!selectedProject) return;

    const deleteWorkspaceToast = appToast.loading(
      getWorktreeRemovalLoadingToast(),
    );
    const result = await removeWorktree(selectedProject.path, workspacePath);
    const removalDecision = evaluateWorktreeRemovalResult(result);
    if (!removalDecision.shouldCleanup) {
      deleteWorkspaceToast.error(getWorktreeRemovalFailureToast(result.error));
      return;
    }

    let cleanupError: string | undefined;
    try {
      const isolationResult =
        await disableWorkspaceIsolationForWorkspace(workspacePath);
      if (!isolationResult.success) {
        cleanupError =
          isolationResult.error ?? "Could not stop Project Services.";
      }

      const workspaceDeleteResult = await deleteCodeWorkspace(workspacePath);
      if (!workspaceDeleteResult.success) {
        cleanupError =
          workspaceDeleteResult.error ?? "Could not delete the workspace file.";
      }
    } catch (error) {
      cleanupError =
        error instanceof Error ? error.message : "Workspace cleanup failed.";
    } finally {
      unassignTarget(workspacePath);
      clearWorkspaceRelaunchFlag(workspacePath);
    }

    setProjectWorkspaces((prev) => {
      const next = { ...prev };
      const list = (next[selectedProject.id] ?? []).filter(
        (ws) => ws.workspace !== workspacePath,
      );
      next[selectedProject.id] = list;

      const updatedProject: Project = {
        ...selectedProject,
        worktrees: Math.max((selectedProject.worktrees ?? 1) - 1, 0),
        workspaces: list,
      };

      setSelectedProject(updatedProject);
      setProjects((prevProjects) => {
        const updatedProjects = prevProjects.map((project) =>
          project.id === updatedProject.id ? updatedProject : project,
        );
        projectStorage.save(updatedProjects);
        return updatedProjects;
      });

      return next;
    });

    if (cleanupError) {
      deleteWorkspaceToast.error(getWorktreeRemovalFailureToast(cleanupError));
      return;
    }

    deleteWorkspaceToast.dismiss();
  };

  const handleEnvironmentChange = async (
    environmentId: string | null,
    binding: EnvironmentBinding,
  ) => {
    const currentEnvironmentId =
      environmentForTarget(binding.targetPath)?.id ?? null;
    if (currentEnvironmentId === environmentId) {
      return;
    }

    ensureLaunchedEnvironment(binding.targetPath, currentEnvironmentId);

    if (!environmentId) {
      unassignTarget(binding.targetPath);
      await writeCodeWorkspace(binding.targetPath, null);
      return;
    }

    const result = assignTarget(environmentId, binding);
    if (!result.success) {
      appToast.error({
        title: "Unable to attach environment",
        description: result.error ?? "Unknown environment error.",
      });
      return;
    }

    const selectedEnv = environments.find((env) => env.id === environmentId);
    const workspaceResult = await writeCodeWorkspace(binding.targetPath, {
      address: selectedEnv?.address,
      envVars: selectedEnv?.envVars,
    });

    if (!workspaceResult.success) {
      console.warn(
        "Failed to update .code-workspace file:",
        workspaceResult.error,
      );
    }
  };

  const getEnvironmentIdForTarget = (targetPath: string) => {
    return environmentForTarget(targetPath)?.id ?? null;
  };

  const handleSearchProjectSyncTargets = useCallback(
    async (query: string) => {
      if (!selectedProject?.path) {
        setSyncTargetSearchResults([]);
        setIsSearchingSyncTargets(false);
        return;
      }

      const trimmed = query.trim();
      if (trimmed.length < 2) {
        setSyncTargetSearchResults([]);
        setIsSearchingSyncTargets(false);
        return;
      }

      setIsSearchingSyncTargets(true);
      try {
        const targets = await searchProjectSyncTargets(
          selectedProject.path,
          trimmed,
        );
        setSyncTargetSearchResults(targets);
      } catch (error) {
        console.error("Sync target search failed:", error);
        appToast.error({
          title: "Sync search failed",
          description: "Unable to list files and folders for this project.",
        });
      } finally {
        setIsSearchingSyncTargets(false);
      }
    },
    [appToast, selectedProject?.path],
  );

  const updateSelectedProject = (next: Project) => {
    setSelectedProject(next);
    setProjects((prev) => {
      const updatedProjects = prev.map((project) =>
        project.id === next.id ? next : project,
      );
      projectStorage.save(updatedProjects);
      return updatedProjects;
    });
  };

  const {
    importReview,
    isApplyingProjectConfigImport,
    handleCancelProjectConfigImport,
    handleConfirmProjectConfigImport,
    handleExportProjectConfig,
    handleImportProjectConfig,
  } = useProjectConfigTransfer({
    selectedProject,
    appToast,
    updateSelectedProject,
    workspaceIsolationTopologyForProject,
    saveWorkspaceIsolationProjectTopology,
    deleteWorkspaceIsolationProjectTopology,
  });

  const handleAddSyncTarget = (target: SyncTarget) => {
    if (!selectedProject) return;
    const normalizedPath = normalizeSyncTargetPath(target.path);
    if (!normalizedPath) return;

    const normalizedTarget: SyncTarget = {
      path: normalizedPath,
      kind: target.kind,
    };

    const existing = selectedProject.syncTargets ?? [];
    if (includesSyncTarget(existing, normalizedTarget)) {
      return;
    }

    const nextSyncTargets = normalizeSyncTargets([...existing, normalizedTarget]);
    const selectionDidChange =
      existing.length !== nextSyncTargets.length ||
      existing.some((candidate, index) => !isSameSyncTarget(candidate, nextSyncTargets[index]!));
    if (!selectionDidChange) {
      return;
    }

    const updatedProject: Project = {
      ...selectedProject,
      syncTargets: nextSyncTargets,
    };
    updateSelectedProject(updatedProject);
    trackConfigFileAdded(normalizedTarget.path, normalizedTarget.kind);
  };

  const handleRemoveSyncTarget = (target: SyncTarget) => {
    if (!selectedProject) return;
    const existing = selectedProject.syncTargets ?? [];
    const updatedProject: Project = {
      ...selectedProject,
      syncTargets: existing.filter((candidate) => {
        return candidate.path !== target.path || candidate.kind !== target.kind;
      }),
    };
    updateSelectedProject(updatedProject);
  };

  useEffect(() => {
    setSyncTargetSearchResults([]);
    setIsSearchingSyncTargets(false);
  }, [selectedProject?.id]);

  const handleOpenInEditor = async (targetPath: string) => {
    const preferredEditor = getPreferredEditor();
    const env = environmentForTarget(targetPath);
    let openPath = targetPath;

    // Always use .code-workspace file if it exists
    const workspaceInfo = await getCodeWorkspacePath(targetPath);
    if (workspaceInfo?.exists) {
      openPath = workspaceInfo.workspacePath;
    }

    const result = await openProjectInEditor(preferredEditor, openPath);
    if (result.success) {
      return;
    }

    appToast.error({
      title: "Failed to open editor",
      description: result.error ?? `Unable to launch ${preferredEditor}.`,
    });
  };

  const handleLoadProjectBranches = useCallback(() => {
    void loadProjectBranches(selectedProject);
  }, [loadProjectBranches, selectedProject]);

  return (
    <div className="space-y-8 p-6">
      {selectedProject ? (
        <ProjectDetail
          project={selectedProject}
          workspaces={projectWorkspaces[selectedProject.id] ?? []}
          gitBranches={projectBranches}
          isLoadingBranches={isLoadingBranches}
          isCreatingWorkspace={isCreatingWorkspace}
          onLoadBranches={handleLoadProjectBranches}
          onBack={() => setSelectedProject(null)}
          onCreateWorkspace={handleCreateWorkspace}
          onOpenInEditor={handleOpenInEditor}
          onDeleteWorkspace={handleDeleteWorkspace}
          syncTargets={selectedProject.syncTargets ?? []}
          syncTargetSearchResults={syncTargetSearchResults}
          isSearchingSyncTargets={isSearchingSyncTargets}
          onExportProjectConfig={handleExportProjectConfig}
          onImportProjectConfig={handleImportProjectConfig}
          onSearchSyncTargets={handleSearchProjectSyncTargets}
          onAddSyncTarget={handleAddSyncTarget}
          onRemoveSyncTarget={handleRemoveSyncTarget}
          environments={environments}
          getEnvironmentIdForTarget={getEnvironmentIdForTarget}
          onEnvironmentChange={handleEnvironmentChange}
        />
      ) : (
        <ProjectList
          projects={projects}
          onAddProject={handleAddProject}
          onViewProject={handleViewProject}
          onDeleteProject={handleDeleteProject}
        />
      )}
      <ProjectConfigImportReviewDialog
        review={importReview}
        isApplying={isApplyingProjectConfigImport}
        onCancel={handleCancelProjectConfigImport}
        onConfirm={handleConfirmProjectConfigImport}
      />
    </div>
  );
};

export default Index;
