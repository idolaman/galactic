import { useCallback, useEffect, useState } from "react";
import { toast as sonnerToast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { ProjectList } from "@/components/ProjectList";
import { ProjectDetail } from "@/components/ProjectDetail";
import { useToast } from "@/hooks/use-toast";
import { useBranchLoader } from "@/hooks/use-branch-loader";
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
import { dedupeSyncTargets, includesSyncTarget, normalizeSyncTargetPath } from "@/services/sync-targets";
import { evaluateWorktreeRemovalResult, getWorktreeRemovalFailureToast } from "@/lib/worktree-removal";
import { reconcileProjectWorkspaces, toAdditionalWorkspaces } from "@/lib/workspace-reconciliation";
import type { CreateWorkspaceRequest } from "@/lib/create-workspace-request";
import type { SyncTarget } from "@/types/sync-target";

type Project = StoredProject;

const Index = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { toast } = useToast();
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
  const { loadProjectBranches, clearProjectBranches } = useBranchLoader({
    setIsLoadingBranches,
    setProjectBranches,
    toast,
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

    // Clean up the repository root workspace file
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
    const toastId = sonnerToast.loading("Creating workspace...");

    try {
      const syncTargets = selectedProject.syncTargets ?? [];
      const result = await createWorktree(selectedProject.path, branch, {
        createBranch: request.createBranch,
        startPoint: request.startPoint,
      });

      if (!result.success || !result.path) {
        sonnerToast.error("Failed to create workspace", {
          id: toastId,
          description: result.error ?? "Unknown error running git worktree.",
          duration: Number.POSITIVE_INFINITY,
        });
        return false;
      }

      if (syncTargets.length > 0 && result.path) {
        sonnerToast.loading("Copying selected files and folders...", {
          id: toastId,
        });
        const copyResult = await copyProjectSyncTargetsToWorktree(
          selectedProject.path,
          result.path,
          syncTargets,
        );
        if (!copyResult.success) {
          const copyFailureDescription =
            copyResult.errors?.map((entry) => `${entry.path}: ${entry.message}`).join("\n") ??
            "Unable to copy selected sync files and folders.";
          console.warn("Workspace sync copy had issues:", copyFailureDescription);
        }
      }

      sonnerToast.loading("Finalizing workspace...", { id: toastId });
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

      sonnerToast.success("Workspace created!", {
        id: toastId,
        duration: 2000,
      });

      return true;
    } catch (error) {
      sonnerToast.error("Failed to create workspace", {
        id: toastId,
        description:
          error instanceof Error
            ? error.message
            : "Unknown workspace creation error.",
        duration: Number.POSITIVE_INFINITY,
      });
      return false;
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  const handleDeleteWorkspace = async (workspacePath: string, branchName: string) => {
    if (!selectedProject) return;

    const result = await removeWorktree(selectedProject.path, workspacePath);
    const removalDecision = evaluateWorktreeRemovalResult(result);
    if (!removalDecision.shouldCleanup) {
      toast(getWorktreeRemovalFailureToast());
      return;
    }

    // Delete associated .code-workspace file
    unassignTarget(workspacePath);
    await deleteCodeWorkspace(workspacePath);
    clearWorkspaceRelaunchFlag(workspacePath);

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
      toast({
        title: "Unable to attach environment",
        description: result.error ?? "Unknown environment error.",
        variant: "destructive",
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
        toast({
          title: "Sync search failed",
          description: "Unable to list files and folders for this project.",
          variant: "destructive",
        });
      } finally {
        setIsSearchingSyncTargets(false);
      }
    },
    [selectedProject?.path, toast],
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

    const updatedProject: Project = {
      ...selectedProject,
      syncTargets: dedupeSyncTargets([...existing, normalizedTarget]),
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

    toast({
      title: "Failed to open editor",
      description: result.error ?? `Unable to launch ${preferredEditor}.`,
      variant: "destructive",
    });
  };

  const handleLoadProjectBranches = useCallback(() => {
    void loadProjectBranches(selectedProject);
  }, [loadProjectBranches, selectedProject]);

  const handleClearProjectBranches = useCallback(() => {
    clearProjectBranches();
  }, [clearProjectBranches]);

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
          onClearBranches={handleClearProjectBranches}
          onBack={() => setSelectedProject(null)}
          onCreateWorkspace={handleCreateWorkspace}
          onOpenInEditor={handleOpenInEditor}
          onDeleteWorkspace={handleDeleteWorkspace}
          syncTargets={selectedProject.syncTargets ?? []}
          syncTargetSearchResults={syncTargetSearchResults}
          isSearchingSyncTargets={isSearchingSyncTargets}
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
    </div>
  );
};

export default Index;
