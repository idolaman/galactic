import { FileCode, Info } from "lucide-react";
import { ProjectDetailHeader } from "@/components/ProjectDetailHeader";
import { ProjectSyncTargets } from "@/components/ProjectSyncTargets";
import { ProjectWorkspacesSection } from "@/components/ProjectWorkspacesSection";
import type { CreateWorkspaceRequest } from "@/lib/create-workspace-request";
import type { Workspace } from "@/types/workspace";
import type { Environment, EnvironmentBinding } from "@/types/environment";
import type { SyncTarget } from "@/types/sync-target";

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
      <div className="space-y-4 border-t border-border pt-6">
        <div className="flex flex-col gap-4">
          <h2 className="flex items-center gap-2 text-xl font-bold text-foreground/80">
            <FileCode className="h-5 w-5" />
            Workspace Config Sync
          </h2>

          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">Sync your .env files</p>
              <p className="text-xs">
                Files and folders selected here will be automatically synced
                from <code className="rounded bg-muted/50 px-1 font-mono">{project.path}</code> into every new workspace, replacing matching paths.
              </p>
            </div>
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
