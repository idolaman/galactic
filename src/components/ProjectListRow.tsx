import { FolderGit2, GitBranch, RadioTower, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { shouldActivateProjectListRowFromKey } from "@/lib/project-list-row";
import type { StoredProject } from "@/services/projects";

export interface ProjectListRowProps {
  onDelete: (project: StoredProject) => void;
  onViewProject: (project: StoredProject) => void;
  project: StoredProject;
  serviceCount: number;
}

export function ProjectListRow({
  onDelete,
  onViewProject,
  project,
  serviceCount,
}: ProjectListRowProps) {
  return (
    <div
      className="group grid min-h-16 cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/45"
      role="button"
      tabIndex={0}
      onClick={() => onViewProject(project)}
      onKeyDown={(event) => {
        if (shouldActivateProjectListRowFromKey(event.key, event.target === event.currentTarget)) {
          event.preventDefault();
          onViewProject(project);
        }
      }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
          <FolderGit2 className="h-4 w-4" />
        </div>
        <div className="min-w-0 space-y-1">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="truncate text-sm font-semibold">{project.name}</h3>
          </div>
          <code className="block truncate text-xs text-muted-foreground" title={project.path}>
            {project.path}
          </code>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Badge variant="outline" className="hidden h-6 gap-1.5 px-2 text-xs sm:inline-flex">
          <GitBranch className="h-3 w-3" />
          {project.worktrees}
        </Badge>
        <Badge variant="outline" className="hidden h-6 gap-1.5 px-2 text-xs md:inline-flex">
          <RadioTower className="h-3 w-3" />
          {serviceCount}
        </Badge>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 group-focus-within:opacity-100"
          aria-label={`Remove ${project.name}`}
          onClick={(event) => {
            event.stopPropagation();
            onDelete(project);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
