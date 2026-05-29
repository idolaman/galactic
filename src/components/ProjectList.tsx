import { useState } from "react";
import { FolderGit2, Plus } from "lucide-react";

import { ProjectListRow } from "@/components/ProjectListRow";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useDialogExitSnapshot } from "@/hooks/use-dialog-exit-snapshot";
import type { StoredProject } from "@/services/projects";

interface ProjectListProps {
  getProjectServiceCount: (projectId: string) => number;
  onAddProject: () => void;
  onDeleteProject: (projectId: string) => void;
  onViewProject: (project: StoredProject) => void;
  projects: StoredProject[];
}

export const ProjectList = ({
  getProjectServiceCount,
  onAddProject,
  onViewProject,
  onDeleteProject,
  projects,
}: ProjectListProps) => {
  const [projectPendingDelete, setProjectPendingDelete] = useState<StoredProject | null>(null);
  const {
    snapshot: projectDeleteSnapshot,
    handleExitComplete: handleDeleteExitComplete,
  } = useDialogExitSnapshot(projectPendingDelete);
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 border-b border-border pb-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold leading-tight">Projects</h2>
          <p className="text-sm text-muted-foreground">
            Repositories, branch workspaces, and services.
          </p>
        </div>
        <Button onClick={onAddProject} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Add Project
        </Button>
      </div>

      {projects.length > 0 ? (
        <div className="overflow-hidden rounded-md border border-border bg-card">
          {projects.map((project) => (
            <ProjectListRow
              key={project.id}
              project={project}
              serviceCount={getProjectServiceCount(project.id)}
              onViewProject={onViewProject}
              onDelete={setProjectPendingDelete}
            />
          ))}
        </div>
      ) : (
        <div className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-md border border-dashed border-border bg-card px-6 text-center">
          <FolderGit2 className="h-10 w-10 text-muted-foreground" />
          <div className="space-y-1">
            <h3 className="text-base font-semibold">No projects yet</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              Add a repository to start managing branch workspaces and Project Services.
            </p>
          </div>
          <Button onClick={onAddProject}>
            <Plus className="mr-2 h-4 w-4" />
            Add Project
          </Button>
        </div>
      )}

      <AlertDialog open={!!projectPendingDelete} onOpenChange={(open) => !open && setProjectPendingDelete(null)}>
        <AlertDialogContent onExitComplete={handleDeleteExitComplete}>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove project</AlertDialogTitle>
            <AlertDialogDescription>
              {projectDeleteSnapshot ? (
                <>
                  Remove {projectDeleteSnapshot.name} from Galactic?
                  <br />
                  This action cannot be undone.
                </>
              ) : (
                "This action cannot be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (projectDeleteSnapshot) {
                  onDeleteProject(projectDeleteSnapshot.id);
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
