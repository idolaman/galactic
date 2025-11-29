import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FolderGit2, GitBranch, Layers, Plus, Eye, Trash2 } from "lucide-react";

interface Project {
  id: string;
  name: string;
  path: string;
  isGitRepo: boolean;
  worktrees: number;
}

interface ProjectListProps {
  projects: Project[];
  onAddProject: () => void;
  onViewProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
}

export const ProjectList = ({
  projects,
  onAddProject,
  onViewProject,
  onDeleteProject,
}: ProjectListProps) => {
  const [projectPendingDelete, setProjectPendingDelete] = useState<Project | null>(null);
  const gitProjects = useMemo(() => projects.filter((project) => project.isGitRepo).length, [projects]);
  const totalWorktrees = useMemo(() => projects.reduce((total, project) => total + project.worktrees, 0), [projects]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Browse and manage all repositories from one control center.</p>
          <div className="flex items-center gap-2">
            <FolderGit2 className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold leading-tight">Projects</h2>
          </div>
        </div>
        <Button onClick={onAddProject} className="bg-primary hover:bg-primary-glow transition-all duration-300 shadow-glow">
          <Plus className="mr-2 h-4 w-4" />
          Add Project
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Tracked Projects</p>
              <p className="text-sm text-muted-foreground">All imported folders</p>
            </div>
            <FolderGit2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{projects.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Git Repos</p>
              <p className="text-sm text-muted-foreground">Ready for worktrees</p>
            </div>
            <GitBranch className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{gitProjects}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Worktrees</p>
              <p className="text-sm text-muted-foreground">Across all projects</p>
            </div>
            <Layers className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{totalWorktrees}</p>
          </CardContent>
        </Card>
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
                <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors flex items-center gap-2">
                  {project.name}
                  {!project.isGitRepo && (
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                      No Git
                    </Badge>
                  )}
                </h3>
                <code className="text-xs text-muted-foreground">{project.path}</code>
              </div>
              
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={(event) => {
                    event.stopPropagation();
                    onViewProject(project);
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={(event) => {
                    event.stopPropagation();
                    setProjectPendingDelete(project);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
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

      <AlertDialog open={!!projectPendingDelete} onOpenChange={(open) => !open && setProjectPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove project</AlertDialogTitle>
            <AlertDialogDescription>
              {projectPendingDelete
                ? `Are you sure you want to remove ${projectPendingDelete.name} from Galactic?`
                : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (projectPendingDelete) {
                  onDeleteProject(projectPendingDelete.id);
                  setProjectPendingDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
