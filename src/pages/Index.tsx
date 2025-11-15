import { useCallback, useMemo, useState } from "react";
import { ProjectList } from "@/components/ProjectList";
import { ProjectDetail } from "@/components/ProjectDetail";
import { useToast } from "@/hooks/use-toast";
import { chooseProjectDirectory } from "@/services/os";
import { getGitInfo, listBranches as listGitBranches } from "@/services/git";
import { projectStorage, type StoredProject } from "@/services/projects";
import { openProjectInEditor, type EditorName } from "@/services/editor";

type Project = StoredProject;

interface Branch {
  name: string;
  workspace?: string;
}

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

  const mockBranches: Branch[] = [
    { name: "feature/new-ui", workspace: "~/Projects/my-app-workspaces/feature-new-ui" },
    { name: "bugfix/login", workspace: "~/Projects/my-app-workspaces/bugfix-login" },
    { name: "feature/payments" },
    { name: "refactor/database" },
    { name: "feature/api-integration" },
    { name: "hotfix/security-patch" },
  ];

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
    };

    setProjects(projectStorage.upsert(newProject));

    setSelectedProject(newProject);
    toast({
      title: "Project added",
      description: `${projectName} is ready to manage.`,
    });
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
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

    toast({
      title: "Project removed",
      description: `${projectToDelete.name} deleted from your project list.`,
    });
  };

  const handleCreateWorkspace = (branch: string) => {
    toast({
      title: "Creating workspace",
      description: `Setting up workspace for ${branch}`,
    });
  };

  const handleDebugInMain = (workspace: string, branch: string) => {
    toast({
      title: "Debug in Main",
      description: `Pushing changes from ${branch} and switching main codebase`,
    });
  };

  const handleEnvironmentChange = (workspace: string, env: string) => {
    toast({
      title: "Environment Changed",
      description: `Switched to ${env} for this workspace`,
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
          branches={mockBranches}
          gitBranches={projectBranches}
          environments={mockEnvironments}
          onLoadBranches={loadProjectBranches}
          onBack={() => setSelectedProject(null)}
          onCreateWorkspace={handleCreateWorkspace}
          onDebugInMain={handleDebugInMain}
          onOpenInEditor={handleOpenInEditor}
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
