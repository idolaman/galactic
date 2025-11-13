import { useMemo, useState } from "react";
import { ProjectList } from "@/components/ProjectList";
import { ProjectDetail } from "@/components/ProjectDetail";
import { useToast } from "@/hooks/use-toast";
import { chooseProjectDirectory } from "@/services/os";
import { getGitInfo } from "@/services/git";

interface Project {
  id: string;
  name: string;
  path: string;
  isGitRepo: boolean;
  currentBranch?: string | null;
  worktrees: number;
}

interface Branch {
  name: string;
  workspace?: string;
}

const Index = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { toast } = useToast();

  const preferredEditor = useMemo(() => {
    if (typeof window === "undefined") return "Cursor";
    const stored = window.localStorage.getItem("preferredEditor");
    return stored || "Cursor";
  }, []);

  const [projects, setProjects] = useState<Project[]>([]);

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

    setProjects((prev) => {
      const existingIndex = prev.findIndex((project) => project.path === normalizedPath);
      if (existingIndex >= 0) {
        const nextProjects = [...prev];
        nextProjects[existingIndex] = newProject;
        return nextProjects;
      }
      return [newProject, ...prev];
    });

    setSelectedProject(newProject);
    toast({
      title: "Project added",
      description: `${projectName} is ready to manage.`,
    });
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
  };

  const handleDeleteProject = (projectId: string) => {
    const projectToDelete = projects.find((project) => project.id === projectId);
    if (!projectToDelete) {
      return;
    }

    if (selectedProject?.id === projectId) {
      setSelectedProject(null);
    }

    setProjects((prev) => prev.filter((project) => project.id !== projectId));

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

  const handleOpenInEditor = (path: string) => {
    toast({
      title: "Opening in editor",
      description: `Launching ${preferredEditor} with ${path}`,
    });
  };

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {selectedProject ? (
          <ProjectDetail
            project={selectedProject}
            branches={mockBranches}
            environments={mockEnvironments}
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
    </div>
  );
};

export default Index;
