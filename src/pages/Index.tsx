import { useCallback, useMemo, useState } from "react";
import { ProjectList } from "@/components/ProjectList";
import { ProjectDetail } from "@/components/ProjectDetail";
import { useToast } from "@/hooks/use-toast";
import { chooseProjectDirectory } from "@/services/os";
import { createWorktree, getGitInfo, listBranches as listGitBranches, removeWorktree } from "@/services/git";
import { projectStorage, type StoredProject } from "@/services/projects";
import { openProjectInEditor, type EditorName } from "@/services/editor";
import type { Workspace } from "@/types/workspace";

type Project = StoredProject;

const Index = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { toast } = useToast();

  const preferredEditor = useMemo<EditorName>(() => {
    if (typeof window === "undefined") return "Cursor";
    const stored = window.localStorage.getItem("preferredEditor");
    return stored === "VSCode" ? "VSCode" : "Cursor";
  }, []);

  const [projects, setProjects] = useState<Project[]>(() => projectStorage.load());
  const [projectBranches, setProjectBranches] = useState<string[]>([]);
  const [projectWorkspaces, setProjectWorkspaces] = useState<Record<string, Workspace[]>>(() => {
    const loaded = projectStorage.load();
    return loaded.reduce((acc, project) => {
      acc[project.id] = project.workspaces ?? [];
      return acc;
    }, {} as Record<string, Workspace[]>);
  });

  const mockEnvironments = ["Development", "Staging", "Production"];

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

    const newProject: Project = {
      id: normalizedPath,
      name: projectName,
      path: normalizedPath,
      isGitRepo: gitInfo.isGitRepo,
      currentBranch: gitInfo.currentBranch,
      worktrees: 0,
      workspaces: [],
    };

    setProjects(projectStorage.upsert(newProject));
    setProjectWorkspaces((prev) => ({ ...prev, [newProject.id]: newProject.workspaces ?? [] }));

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

    const result = await createWorktree(selectedProject.path, branch);

    if (!result.success || !result.path) {
      toast({
        title: "Failed to create workspace",
        description: result.error ?? "Unknown error running git worktree.",
        variant: "destructive",
      });
      return;
    }

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
  };

  const handleDebugInMain = (workspace: string, branch: string) => {
    toast({
      title: "Debug in Main",
      description: `Pushing changes from ${branch} and switching base code`,
    });
  };

  const handleEnvironmentChange = (workspace: string, env: string) => {
    toast({
      title: "Environment Changed",
      description: `Switched to ${env} for this workspace`,
    });
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

  const handleOpenInEditor = async (path: string) => {
    const result = await openProjectInEditor(preferredEditor, path);
    if (result.success) {
      toast({
        title: `Opening in ${preferredEditor}`,
        description: path,
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
    const branches = await listGitBranches(selectedProject.path);
    setProjectBranches(branches);
  }, [selectedProject?.path, selectedProject?.isGitRepo]);

  return (
    <div className="space-y-8 p-6">
      {selectedProject ? (
        <ProjectDetail
          project={selectedProject}
          workspaces={projectWorkspaces[selectedProject.id] ?? []}
          gitBranches={projectBranches}
          environments={mockEnvironments}
          onLoadBranches={loadProjectBranches}
          onBack={() => setSelectedProject(null)}
          onCreateWorkspace={handleCreateWorkspace}
          onDebugInMain={handleDebugInMain}
          onOpenInEditor={handleOpenInEditor}
          onEnvironmentChange={handleEnvironmentChange}
          onDeleteWorkspace={handleDeleteWorkspace}
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
