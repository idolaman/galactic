import { useState } from "react";
import { GitHubAuth } from "@/components/GitHubAuth";
import { Header } from "@/components/Header";
import { EditorSelector } from "@/components/EditorSelector";
import { ProjectList } from "@/components/ProjectList";
import { ProjectDetail } from "@/components/ProjectDetail";
import { useToast } from "@/hooks/use-toast";

interface User {
  name: string;
  avatar: string;
}

interface Project {
  id: string;
  name: string;
  path: string;
  currentBranch: string;
  worktrees: number;
}

interface Branch {
  name: string;
  worktree?: string;
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [selectedEditor, setSelectedEditor] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { toast } = useToast();

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
    { name: "feature/new-ui", worktree: "~/Projects/my-app-worktrees/feature-new-ui" },
    { name: "bugfix/login", worktree: "~/Projects/my-app-worktrees/bugfix-login" },
    { name: "feature/payments" },
    { name: "refactor/database" },
  ];

  const handleAuthSuccess = (userData: User) => {
    setUser(userData);
    toast({
      title: "Welcome back!",
      description: "Successfully signed in with GitHub",
    });
  };

  const handleEditorSelect = (editor: string) => {
    setSelectedEditor(editor);
    toast({
      title: "Editor selected",
      description: `${editor} is ready to use`,
    });
  };

  const handleAddProject = () => {
    toast({
      title: "Add Project",
      description: "Project directory picker would open here",
    });
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
  };

  const handleCreateWorktree = (branch: string) => {
    toast({
      title: "Creating worktree",
      description: `Setting up worktree for ${branch}`,
    });
  };

  const handleConvertToBase = (worktree: string) => {
    toast({
      title: "Converting worktree",
      description: "Merging changes and cleaning up worktree",
      variant: "destructive",
    });
  };

  const handleOpenInEditor = (path: string) => {
    toast({
      title: "Opening in editor",
      description: `Launching ${selectedEditor} with ${path}`,
    });
  };

  const handleLogout = () => {
    setUser(null);
    setSelectedEditor(null);
    setSelectedProject(null);
  };

  if (!user) {
    return <GitHubAuth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onLogout={handleLogout} />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {!selectedEditor ? (
          <EditorSelector 
            onSelect={handleEditorSelect} 
            selectedEditor={selectedEditor}
          />
        ) : selectedProject ? (
          <ProjectDetail
            project={selectedProject}
            branches={mockBranches}
            onBack={() => setSelectedProject(null)}
            onCreateWorktree={handleCreateWorktree}
            onConvertToBase={handleConvertToBase}
            onOpenInEditor={handleOpenInEditor}
          />
        ) : (
          <ProjectList 
            projects={projects}
            onAddProject={handleAddProject}
            onViewProject={handleViewProject}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
