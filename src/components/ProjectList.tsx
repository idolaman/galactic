import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderGit2, GitBranch, Plus, Eye } from "lucide-react";

interface Project {
  id: string;
  name: string;
  path: string;
  currentBranch: string;
  worktrees: number;
}

interface ProjectListProps {
  projects: Project[];
  onAddProject: () => void;
  onViewProject: (project: Project) => void;
}

export const ProjectList = ({ projects, onAddProject, onViewProject }: ProjectListProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderGit2 className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Projects</h2>
        </div>
        
        <Button 
          onClick={onAddProject}
          className="bg-primary hover:bg-primary-glow transition-all duration-300"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Project
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {projects.map((project) => (
          <Card 
            key={project.id} 
            className="p-6 bg-gradient-card border-border shadow-card hover:shadow-glow transition-all duration-300 cursor-pointer group"
            onClick={() => onViewProject(project)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
                  {project.name}
                </h3>
                <code className="text-xs text-muted-foreground">{project.path}</code>
              </div>
              
              <Button 
                size="sm" 
                variant="ghost"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Branch:</span>
                <Badge variant="secondary" className="font-mono">
                  {project.currentBranch}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Worktrees:</span>
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  {project.worktrees}
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {projects.length === 0 && (
        <Card className="p-12 bg-gradient-card border-border text-center">
          <FolderGit2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
          <p className="text-muted-foreground mb-6">
            Add your first project to get started with worktree management
          </p>
          <Button 
            onClick={onAddProject}
            className="bg-primary hover:bg-primary-glow transition-all duration-300"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Project
          </Button>
        </Card>
      )}
    </div>
  );
};
