import { FileCode, Info } from "lucide-react";

import { ProjectDetailHeader } from "@/components/ProjectDetailHeader";
import { ProjectSyncTargets } from "@/components/ProjectSyncTargets";
import { ProjectWorkspacesSection } from "@/components/ProjectWorkspacesSection";
import type { CreateWorkspaceRequest } from "@/lib/create-workspace-request";
import type { Environment, EnvironmentBinding } from "@/types/environment";
import type { SyncTarget } from "@/types/sync-target";
import type { Workspace } from "@/types/workspace";

interface ProjectDetailProps {
  project: {
    id: string;
    name: string;
    path: string;
    isGitRepo: boolean;
  };
  workspaces: Workspace[];
  gitBranches: string[];
  isLoadingBranches?: boolean;
  isCreatingWorkspace?: boolean;
  onBack: () => void;
  onCreateWorkspace: (request: CreateWorkspaceRequest) => Promise<boolean>;
  onOpenInEditor: (path: string) => void;
  onLoadBranches?: () => void | Promise<void>;
  onDeleteWorkspace: (workspacePath: string, branch: string) => void;
  syncTargets: SyncTarget[];
  syncTargetSearchResults: SyncTarget[];
  isSearchingSyncTargets: boolean;
  onExportProjectConfig: () => void;
  onImportProjectConfig: () => void;
  onSearchSyncTargets: (query: string) => void;
  onAddSyncTarget: (target: SyncTarget) => void;
  onRemoveSyncTarget: (target: SyncTarget) => void;
  environments: Environment[];
  getEnvironmentIdForTarget: (targetPath: string) => string | null;
  onEnvironmentChange: (
    environmentId: string | null,
    binding: EnvironmentBinding,
  ) => void;
}

export const ProjectDetail = ({
  project,
  workspaces,
  gitBranches,
  isLoadingBranches,
  isCreatingWorkspace = false,
  onBack,
  onCreateWorkspace,
  onOpenInEditor,
  onLoadBranches,
  onDeleteWorkspace,
  syncTargets,
  syncTargetSearchResults,
  isSearchingSyncTargets,
  onExportProjectConfig,
  onImportProjectConfig,
  onSearchSyncTargets,
  onAddSyncTarget,
  onRemoveSyncTarget,
  environments,
  getEnvironmentIdForTarget,
  onEnvironmentChange,
}: ProjectDetailProps) => (
  <div className="space-y-6">
    <ProjectDetailHeader
      isGitRepo={project.isGitRepo}
      name={project.name}
      path={project.path}
      onBack={onBack}
      onExportProjectConfig={onExportProjectConfig}
      onImportProjectConfig={onImportProjectConfig}
    />

    <ProjectWorkspacesSection
      environments={environments}
      getEnvironmentIdForTarget={getEnvironmentIdForTarget}
      gitBranches={gitBranches}
      isCreatingWorkspace={isCreatingWorkspace}
      isGitRepo={project.isGitRepo}
      isLoadingBranches={isLoadingBranches}
      onCreateWorkspace={onCreateWorkspace}
      onDeleteWorkspace={onDeleteWorkspace}
      onEnvironmentChange={onEnvironmentChange}
      onLoadBranches={onLoadBranches}
      onOpenInEditor={onOpenInEditor}
      projectId={project.id}
      projectName={project.name}
      projectPath={project.path}
      workspaces={workspaces}
    />

    {project.isGitRepo ? (
      <div className="space-y-4 border-t border-border pt-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground">
              <FileCode className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold">Config sync</h2>
              <p className="truncate text-xs text-muted-foreground">
                Files copied from the repository root into new workspaces.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground sm:max-w-md">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Matching paths are replaced when a workspace is created, including selected
              <code className="rounded bg-muted px-1 font-mono">.env</code> files.
            </p>
          </div>
        </div>

        <ProjectSyncTargets
          projectPath={project.path}
          syncTargets={syncTargets}
          searchResults={syncTargetSearchResults}
          isSearching={isSearchingSyncTargets}
          onSearchTargets={onSearchSyncTargets}
          onAddSyncTarget={onAddSyncTarget}
          onRemoveSyncTarget={onRemoveSyncTarget}
        />
      </div>
    ) : null}
  </div>
);
