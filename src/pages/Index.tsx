import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ProjectList } from "@/components/ProjectList";
import { ProjectDetail } from "@/components/ProjectDetail";
import { useToast } from "@/hooks/use-toast";
import { chooseProjectDirectory } from "@/services/os";
import { createWorktree, getGitInfo, listBranches as listGitBranches, removeWorktree, getWorktrees, fetchBranches } from "@/services/git";
import { projectStorage, type StoredProject } from "@/services/projects";
import { getPreferredEditor, openProjectInEditor } from "@/services/editor";
import type { Workspace } from "@/types/workspace";
import { copyProjectSyncTargetsToWorktree, searchProjectSyncTargets } from "@/services/files";
import { useEnvironmentManager } from "@/hooks/use-environment-manager";
import type { EnvironmentBinding } from "@/types/environment";
import { writeCodeWorkspace, getCodeWorkspacePath, deleteCodeWorkspace } from "@/services/workspace";
import { clearWorkspaceRelaunchFlag, ensureLaunchedEnvironment } from "@/services/workspace-state";
import { trackConfigFileAdded } from "@/services/analytics";
import { dedupeSyncTargets, includesSyncTarget, normalizeSyncTargetPath } from "@/services/sync-targets";
import type { SyncTarget } from "@/types/sync-target";

type Project = StoredProject;

const Index = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>(() => projectStorage.load());
  const [projectBranches, setProjectBranches] = useState<string[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [showCreateWorkspaceProgress, setShowCreateWorkspaceProgress] = useState(false);
  const [createWorkspaceStatusLabel, setCreateWorkspaceStatusLabel] = useState("");
  const [projectWorkspaces, setProjectWorkspaces] = useState<Record<string, Workspace[]>>(() => {
    const loaded = projectStorage.load();
    return loaded.reduce((acc, project) => {
      acc[project.id] = project.workspaces ?? [];
      return acc;
    }, {} as Record<string, Workspace[]>);
  });
  const [syncTargetSearchResults, setSyncTargetSearchResults] = useState<SyncTarget[]>([]);
  const [isSearchingSyncTargets, setIsSearchingSyncTargets] = useState(false);
  const { environments, assignTarget, unassignTarget, environmentForTarget } = useEnvironmentManager();

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
      // Filter out the main worktree which typically matches the project path
      // or is the root of the repo. We only want additional worktrees.
      const additionalWorktrees = worktrees.filter((wt) => {
        // Normalize paths for comparison (remove trailing slashes, etc)
        const wtPath = wt.path.replace(/[\\/]+$/, "");
        const projPath = normalizedPath.replace(/[\\/]+$/, "");
        return wtPath !== projPath;
      });

      detectedWorktrees = additionalWorktrees.length;
      detectedWorkspaces = additionalWorktrees.map((wt) => ({
        name: wt.branch,
        workspace: wt.path,
      }));

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
    setProjectWorkspaces((prev) => ({ ...prev, [newProject.id]: newProject.workspaces ?? [] }));

    // Clear any existing environment binding and create .code-workspace without env vars.
    // New projects start "clean", so no relaunch is required yet.
    unassignTarget(normalizedPath);
    await writeCodeWorkspace(normalizedPath, null);
    clearWorkspaceRelaunchFlag(normalizedPath);

    setSelectedProject(newProject);
  };

  const handleViewProject = useCallback((project: Project) => {
    const workspaces = projectWorkspaces[project.id] ?? project.workspaces ?? [];
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
  }, [projectWorkspaces]);

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

  const handleDeleteProject = (projectId: string) => {
    const projectToDelete = projects.find((project) => project.id === projectId);
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
    const workspacesToDelete = projectWorkspaces[projectId] ?? projectToDelete.workspaces ?? [];
    workspacesToDelete.forEach((ws) => {
      unassignTarget(ws.workspace);
      deleteCodeWorkspace(ws.workspace).catch((err) =>
        console.error(`Failed to delete workspace file for ${ws.name}:`, err),
      );
      clearWorkspaceRelaunchFlag(ws.workspace);
    });

  };

  const handleCreateWorkspace = async (branch: string) => {
    if (!selectedProject) {
      return false;
    }

    let progressTimer: ReturnType<typeof setTimeout> | null = null;
    setIsCreatingWorkspace(true);
    setShowCreateWorkspaceProgress(false);
    setCreateWorkspaceStatusLabel("Creating workspace...");
    progressTimer = setTimeout(() => {
      setShowCreateWorkspaceProgress(true);
    }, 500);

    try {
      const syncTargets = selectedProject.syncTargets ?? [];
      const result = await createWorktree(selectedProject.path, branch);

      if (!result.success || !result.path) {
        toast({
          title: "Failed to create workspace",
          description: result.error ?? "Unknown error running git worktree.",
          variant: "destructive",
        });
        return false;
      }

      if (syncTargets.length > 0 && result.path) {
        setCreateWorkspaceStatusLabel("Copying selected files and folders...");
        const copyResult = await copyProjectSyncTargetsToWorktree(selectedProject.path, result.path, syncTargets);
        if (!copyResult.success) {
          const errorMessage =
            copyResult.errors?.map((entry) => `${entry.path}: ${entry.message}`).join("\n") ??
            "Unable to copy selected sync files and folders.";
          toast({
            title: "Sync copy failed",
            description: errorMessage,
            variant: "destructive",
          });
        } else if (copyResult.skipped.length > 0) {
          toast({
            title: "Workspace created with skips",
            description: `${copyResult.skipped.length} file(s) already existed and were skipped.`,
          });
        }
      }

      setCreateWorkspaceStatusLabel("Finalizing workspace...");
      // Clear any existing environment binding and create .code-workspace without env vars.
      // Fresh worktrees also start clean.
      unassignTarget(result.path!);
      await writeCodeWorkspace(result.path, null);
      clearWorkspaceRelaunchFlag(result.path!);

      setProjectWorkspaces((prev) => {
        const next = { ...prev };
        const list = next[selectedProject.id] ? [...next[selectedProject.id]] : [];
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

      return true;
    } finally {
      if (progressTimer) {
        clearTimeout(progressTimer);
      }
      setIsCreatingWorkspace(false);
      setShowCreateWorkspaceProgress(false);
      setCreateWorkspaceStatusLabel("");
    }
  };

  const handleDeleteWorkspace = async (workspacePath: string, branchName: string) => {
    if (!selectedProject) return;

    const result = await removeWorktree(selectedProject.path, workspacePath);
    if (!result.success) {
      toast({
        title: "Failed to remove workspace",
        description: result.error ?? "Unknown error removing git worktree.",
        variant: "destructive",
      });
      return;
    }

    // Delete associated .code-workspace file
    unassignTarget(workspacePath);
    await deleteCodeWorkspace(workspacePath);
    clearWorkspaceRelaunchFlag(workspacePath);

    setProjectWorkspaces((prev) => {
      const next = { ...prev };
      const list = (next[selectedProject.id] ?? []).filter((ws) => ws.workspace !== workspacePath);
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

  const handleEnvironmentChange = async (environmentId: string | null, binding: EnvironmentBinding) => {
    const currentEnvironmentId = environmentForTarget(binding.targetPath)?.id ?? null;
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
      console.warn("Failed to update .code-workspace file:", workspaceResult.error);
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
        const targets = await searchProjectSyncTargets(selectedProject.path, trimmed);
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
      const updatedProjects = prev.map((project) => (project.id === next.id ? next : project));
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

  const loadProjectBranches = useCallback(async () => {
    if (!selectedProject?.path || !selectedProject.isGitRepo) {
      setProjectBranches([]);
      return;
    }

    setIsLoadingBranches(true);
    try {
      // Fetch latest from origin first (runs every time dropdown opens)
      const fetchResult = await fetchBranches(selectedProject.path);
      if (!fetchResult.success) {
        toast({
          title: "Fetch failed",
          description: fetchResult.error ?? "Unable to fetch remote branches.",
          variant: "destructive",
        });
      }

      // Load branches (includes local + remote after fetch)
      const branches = await listGitBranches(selectedProject.path);
      setProjectBranches(branches);
    } finally {
      setIsLoadingBranches(false);
    }
  }, [selectedProject?.path, selectedProject?.isGitRepo, toast]);

  return (
    <div className="space-y-8 p-6">
      {selectedProject ? (
        <ProjectDetail
          project={selectedProject}
          workspaces={projectWorkspaces[selectedProject.id] ?? []}
          gitBranches={projectBranches}
          isLoadingBranches={isLoadingBranches}
          isCreatingWorkspace={isCreatingWorkspace}
          showCreateWorkspaceProgress={showCreateWorkspaceProgress}
          createWorkspaceStatusLabel={createWorkspaceStatusLabel}
          onLoadBranches={loadProjectBranches}
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
