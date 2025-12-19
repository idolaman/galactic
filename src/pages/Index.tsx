import { useCallback, useEffect, useState } from "react";
import { ProjectList } from "@/components/ProjectList";
import { ProjectDetail } from "@/components/ProjectDetail";
import { useToast } from "@/hooks/use-toast";
import { chooseProjectDirectory } from "@/services/os";
import { createWorktree, getGitInfo, listBranches as listGitBranches, removeWorktree, getWorktrees, fetchBranches } from "@/services/git";
import { projectStorage, type StoredProject } from "@/services/projects";
import { getPreferredEditor, openProjectInEditor } from "@/services/editor";
import type { Workspace } from "@/types/workspace";
import { copyProjectFilesToWorktree, searchProjectFiles } from "@/services/files";
import { useEnvironmentManager } from "@/hooks/use-environment-manager";
import type { EnvironmentBinding } from "@/types/environment";
import { writeCodeWorkspace, getCodeWorkspacePath, deleteCodeWorkspace } from "@/services/workspace";
import { markWorkspaceRequiresRelaunch, clearWorkspaceRelaunchFlag } from "@/services/workspace-state";
import { trackConfigFileAdded } from "@/services/analytics";

type Project = StoredProject;

const Index = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { toast } = useToast();

  const [projects, setProjects] = useState<Project[]>(() => projectStorage.load());
  const [projectBranches, setProjectBranches] = useState<string[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [projectWorkspaces, setProjectWorkspaces] = useState<Record<string, Workspace[]>>(() => {
    const loaded = projectStorage.load();
    return loaded.reduce((acc, project) => {
      acc[project.id] = project.workspaces ?? [];
      return acc;
    }, {} as Record<string, Workspace[]>);
  });
  const [fileSearchResults, setFileSearchResults] = useState<string[]>([]);
  const [isSearchingFiles, setIsSearchingFiles] = useState(false);
  const { environments, assignTarget, unassignTarget, environmentForTarget } = useEnvironmentManager();

  const handleAddProject = async () => {
    const projectPath = await chooseProjectDirectory();

    if (!projectPath) {
      toast({
        title: "No project selected",
        description: "Choose a folder to import a project.",
      });
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
      configFiles: [],
    };

    setProjects(projectStorage.upsert(newProject));
    setProjectWorkspaces((prev) => ({ ...prev, [newProject.id]: newProject.workspaces ?? [] }));

    // Clear any existing environment binding and create .code-workspace without env vars.
    // New projects start "clean", so no relaunch is required yet.
    unassignTarget(normalizedPath);
    await writeCodeWorkspace(normalizedPath, null);
    clearWorkspaceRelaunchFlag(normalizedPath);

    setSelectedProject(newProject);
    toast({
      title: "Project added",
      description: `${projectName} is ready to manage.`,
    });
  };

  const handleViewProject = (project: Project) => {
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
  };

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

    toast({
      title: "Project removed",
      description: `${projectToDelete.name} deleted from your project list.`,
    });
  };

  const handleCreateWorkspace = async (branch: string) => {
    if (!selectedProject) {
      return;
    }

    toast({
      title: "Creating workspace",
      description: `Setting up workspace for ${branch}`,
    });

    const configFiles = selectedProject.configFiles ?? [];
    const result = await createWorktree(selectedProject.path, branch);

    if (!result.success || !result.path) {
      toast({
        title: "Failed to create workspace",
        description: result.error ?? "Unknown error running git worktree.",
        variant: "destructive",
      });
      return false;
    }

    if (configFiles.length > 0 && result.path) {
      const copyResult = await copyProjectFilesToWorktree(selectedProject.path, result.path, configFiles);
      if (!copyResult.success) {
        const errorMessage =
          copyResult.errors?.map((entry) => `${entry.file}: ${entry.message}`).join("\n") ??
          "Unable to copy configuration files.";
        toast({
          title: "Config copy failed",
          description: errorMessage,
          variant: "destructive",
        });
      } else if (copyResult.copied.length > 0) {
        toast({
          title: "Config files copied",
          description: `${copyResult.copied.length} file(s) synced into the new workspace.`,
        });
      }
    }

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

    toast({
      title: "Workspace created",
      description: `Git worktree ready at ${result.path}`,
    });

    return true;
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

    toast({
      title: "Workspace removed",
      description: `Removed ${branchName} worktree`,
    });
  };

  const handleEnvironmentChange = async (environmentId: string | null, binding: EnvironmentBinding) => {
    const previousProjectEnvironment = environments.find((env) =>
      env.bindings.some((entry) => entry.projectId === binding.projectId),
    );

    if (!environmentId) {
      unassignTarget(binding.targetPath);
      // Overwrite .code-workspace without env vars. Because the underlying
      // editor window still has the previous env configuration, we still need
      // a relaunch to apply the "no environment" state.
      await writeCodeWorkspace(binding.targetPath, null);
      markWorkspaceRequiresRelaunch(binding.targetPath);
      toast({
        title: "Environment detached",
        description: `${binding.targetLabel} is no longer isolated.`,
      });
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

    // Overwrite .code-workspace file with environment config
    const selectedEnv = environments.find((env) => env.id === environmentId);
    const workspaceResult = await writeCodeWorkspace(binding.targetPath, {
      address: selectedEnv?.address,
      envVars: selectedEnv?.envVars,
    });

    // Environment attachment or change requires a relaunch to apply in the editor.
    markWorkspaceRequiresRelaunch(binding.targetPath);

    if (!workspaceResult.success) {
      console.warn("Failed to update .code-workspace file:", workspaceResult.error);
    }

    toast({
      title: "Environment attached",
      description:
        `${binding.targetLabel} now uses ${selectedEnv?.name ?? "environment"}.` +
        (result.reassigned && previousProjectEnvironment
          ? ` Moved from ${previousProjectEnvironment.name} to keep one workspace per project.`
          : ""),
    });
  };

  const getEnvironmentIdForTarget = (targetPath: string) => {
    return environmentForTarget(targetPath)?.id ?? null;
  };

  const handleSearchProjectFiles = useCallback(
    async (query: string) => {
      if (!selectedProject?.path) {
        setFileSearchResults([]);
        setIsSearchingFiles(false);
        return;
      }

      const trimmed = query.trim();
      if (trimmed.length < 2) {
        setFileSearchResults([]);
        setIsSearchingFiles(false);
        return;
      }

      setIsSearchingFiles(true);
      try {
        const files = await searchProjectFiles(selectedProject.path, trimmed);
        setFileSearchResults(files);
      } catch (error) {
        console.error("File search failed:", error);
        toast({
          title: "File search failed",
          description: "Unable to list configuration files for this project.",
          variant: "destructive",
        });
      } finally {
        setIsSearchingFiles(false);
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

  const handleAddConfigFile = (filePath: string) => {
    if (!selectedProject) return;
    const normalized = filePath.trim();
    if (!normalized) return;
    const existing = selectedProject.configFiles ?? [];
    if (existing.includes(normalized)) {
      return;
    }

    const updatedProject: Project = {
      ...selectedProject,
      configFiles: [...existing, normalized],
    };
    updateSelectedProject(updatedProject);
    trackConfigFileAdded(normalized);
  };

  const handleRemoveConfigFile = (filePath: string) => {
    if (!selectedProject) return;
    const existing = selectedProject.configFiles ?? [];
    const updatedProject: Project = {
      ...selectedProject,
      configFiles: existing.filter((file) => file !== filePath),
    };
    updateSelectedProject(updatedProject);
  };

  useEffect(() => {
    setFileSearchResults([]);
    setIsSearchingFiles(false);
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
      toast({
        title: `Opening in ${preferredEditor}`,
        description: env ? `${targetPath} (with ${env.name} environment)` : targetPath,
      });
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
          onLoadBranches={loadProjectBranches}
          onBack={() => setSelectedProject(null)}
          onCreateWorkspace={handleCreateWorkspace}
          onOpenInEditor={handleOpenInEditor}
          onDeleteWorkspace={handleDeleteWorkspace}
          configFiles={selectedProject.configFiles ?? []}
          fileSearchResults={fileSearchResults}
          isSearchingFiles={isSearchingFiles}
          onSearchFiles={handleSearchProjectFiles}
          onAddConfigFile={handleAddConfigFile}
          onRemoveConfigFile={handleRemoveConfigFile}
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
