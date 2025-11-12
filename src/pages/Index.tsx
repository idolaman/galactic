import { useMemo, useState } from "react";
import { ProjectList } from "@/components/ProjectList";
import { ProjectDetail } from "@/components/ProjectDetail";
import { useToast } from "@/hooks/use-toast";

interface Project {
  id: string;
  name: string;
  path: string;
  currentBranch: string;
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

  // Mock data
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "1",
      name: "my-app",
      path: "~/Projects/my-app",
      currentBranch: "main",
      worktrees: 2
    },
    {
      id: "2",
      name: "backend-api",
      path: "~/Projects/backend-api",
      currentBranch: "develop",
      worktrees: 1
    }
  ]);

  const mockBranches: Branch[] = [
    { name: "feature/new-ui", workspace: "~/Projects/my-app-workspaces/feature-new-ui" },
    { name: "bugfix/login", workspace: "~/Projects/my-app-workspaces/bugfix-login" },
    { name: "feature/payments" },
    { name: "refactor/database" },
    { name: "feature/api-integration" },
    { name: "hotfix/security-patch" },
  ];

  const mockEnvironments = ["Development", "Staging", "Production"];

  const handleAddProject = () => {
    toast({
      title: "Add Project",
      description: "Project directory picker would open here",
    });
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
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
          />
        )}
      </div>
    </div>
  );
};

export default Index;
