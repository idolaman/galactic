import { useMemo, useState } from "react";
import {
  ArrowLeft,
  GitMerge,
  FolderOpen,
  AlertTriangle,
  Trash2,
  FileCode,
  HardDrive,
  Info,
  Settings2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreateWorkspaceDialog } from "@/components/CreateWorkspaceDialog";
import { useWorkspaceIsolationManager } from "@/hooks/use-workspace-isolation-manager";
import { WorkspaceIsolationDialog } from "@/components/WorkspaceIsolationDialog";
import { LaunchButton } from "@/components/LaunchButton";
import { ProjectSyncTargets } from "@/components/ProjectSyncTargets";
import { WorkspaceNetworkingPanel } from "@/components/WorkspaceNetworkingPanel";
import type { CreateWorkspaceRequest } from "@/lib/create-workspace-request";
import { createWorkspaceActivationTargets } from "@/lib/workspace-isolation-activation";
import { getWorkspaceIsolationProjectScopeLabel } from "@/lib/workspace-isolation";
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
  onSearchSyncTargets,
  onAddSyncTarget,
  onRemoveSyncTarget,
  environments,
  getEnvironmentIdForTarget,
  onEnvironmentChange,
}: ProjectDetailProps) => {
  const [isProjectIsolationDialogOpen, setIsProjectIsolationDialogOpen] = useState(false);
  const { workspaceIsolationStacks, workspaceIsolationTopologyForProject } =
    useWorkspaceIsolationManager();
  const projectTopology = workspaceIsolationTopologyForProject(project.id);
  const activationTargets = useMemo(
    () =>
      createWorkspaceActivationTargets({
        workspaceRootPath: project.path,
        workspaceRootLabel: "Repository Root",
        workspaces,
        workspaceIsolationStacks,
      }),
    [project.path, workspaces, workspaceIsolationStacks],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="hover:bg-secondary">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <code className="text-sm text-muted-foreground">{project.path}</code>
        </div>
      </div>

      {/* Workspaces Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <GitMerge className="h-6 w-6 text-primary" />
            Workspaces
          </h2>

          <div className="flex items-center gap-2">
            {project.isGitRepo && (
                <Button
                  variant="outline"
                  onClick={() => setIsProjectIsolationDialogOpen(true)}
                  className="gap-2"
                >
                  <Settings2 className="h-4 w-4" />
                  {getWorkspaceIsolationProjectScopeLabel(
                    projectTopology?.services.length ?? null,
                  )}
                </Button>
            )}
            {project.isGitRepo && (
              <CreateWorkspaceDialog
                projectPath={project.path}
                gitBranches={gitBranches}
                isLoadingBranches={isLoadingBranches}
                isCreatingWorkspace={isCreatingWorkspace}
                onCreateWorkspace={onCreateWorkspace}
                onLoadBranches={onLoadBranches}
              />
            )}
          </div>
        </div>

        <WorkspaceIsolationDialog
          open={isProjectIsolationDialogOpen}
          onOpenChange={setIsProjectIsolationDialogOpen}
          projectId={project.id}
          workspaceRootPath={project.path}
          workspaceRootLabel="Repository Root"
          projectName={project.name}
          activationTargets={activationTargets}
          stack={projectTopology}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {/* Repository Root Card */}
          <Card className="p-4 bg-gradient-card border-primary/20 shadow-sm group">
            <div className="flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-lg text-primary">
                      Repository Root
                    </h3>
                  </div>
                  <div
                    className="text-[10px] text-muted-foreground font-mono truncate select-all px-0.5"
                    title={project.path}
                  >
                    {project.path}
                  </div>
                  {!project.isGitRepo && (
                    <div className="flex items-center gap-2 text-xs text-amber-400 pt-1">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Git not initialized</span>
                    </div>
                  )}
                </div>
                
                <LaunchButton
                  path={project.path}
                  environmentId={getEnvironmentIdForTarget(project.path)}
                  onLaunch={onOpenInEditor}
                  className="h-9 px-5 text-sm font-medium shadow-sm shrink-0"
                >
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Open
                </LaunchButton>
              </div>

              {/* Networking */}
              <div className="pt-1">
                <WorkspaceNetworkingPanel
                  projectId={project.id}
                  projectName={project.name}
                  workspacePath={project.path}
                  workspaceLabel="Repository Root"
                  environments={environments}
                  localEnvironmentId={getEnvironmentIdForTarget(project.path)}
                  onLocalEnvironmentChange={(environmentId) =>
                    onEnvironmentChange(environmentId, {
                      projectId: project.id,
                      projectName: project.name,
                      targetPath: project.path,
                      targetLabel: "Repository Root",
                      kind: "base",
                    })
                  }
                />
              </div>
            </div>
          </Card>

          {workspaces.map((branch) => (
                <Card
                  key={branch.workspace}
                  className="p-4 bg-card/50 border-primary/20 hover:border-primary/40 transition-colors group"
                >
                  <div className="flex flex-col gap-4">
                    {/* Header: Branch Name + Delete */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="bg-primary/10 text-primary border-primary/20 font-mono text-sm py-1 px-2.5 rounded-md max-w-full truncate"
                            title={branch.name}
                          >
                            {branch.name}
                          </Badge>
                        </div>
                        <div
                          className="text-[10px] text-muted-foreground font-mono truncate select-all px-0.5"
                          title={branch.workspace}
                        >
                          {branch.workspace}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all duration-200"
                          onClick={() =>
                            onDeleteWorkspace(branch.workspace, branch.name)
                          }
                          title="Delete Workspace"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <LaunchButton
                          path={branch.workspace}
                          environmentId={getEnvironmentIdForTarget(branch.workspace)}
                          onLaunch={onOpenInEditor}
                          className="h-9 px-5 text-sm font-medium shadow-sm shrink-0"
                        >
                          <FolderOpen className="mr-2 h-4 w-4" />
                          Open
                        </LaunchButton>
                      </div>
                    </div>

                    {/* Networking */}
                    <div className="pt-1">
                      <WorkspaceNetworkingPanel
                        projectId={project.id}
                        projectName={project.name}
                        workspacePath={branch.workspace}
                        workspaceLabel={branch.name}
                        environments={environments}
                        localEnvironmentId={getEnvironmentIdForTarget(branch.workspace)}
                        onLocalEnvironmentChange={(environmentId) =>
                          onEnvironmentChange(environmentId, {
                            projectId: project.id,
                            projectName: project.name,
                            targetPath: branch.workspace,
                            targetLabel: branch.name,
                            kind: "workspace",
                          })
                        }
                      />
                    </div>
                  </div>
                </Card>
              ))}
        </div>
      </div>

      {project.isGitRepo && (
        <>
          {/* Config file sync */}
          <div className="space-y-4 pt-6 border-t border-border">
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold flex items-center gap-2 text-foreground/80">
                <FileCode className="h-5 w-5" />
                Workspace Config Sync
              </h2>

              <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground flex items-start gap-3">
                <Info className="h-4 w-4 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-foreground">
                    Sync your .env files
                  </p>
                  <p className="text-xs">
                    Files and folders selected here will be automatically synced
                    from{" "}
                    <code className="font-mono bg-muted/50 px-1 rounded">
                      {project.path}
                    </code>{" "}
                    into every new workspace, replacing matching paths.
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
        </>
      )}
    </div>
  );
};
