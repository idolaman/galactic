import { useRef, useState } from "react";
import { ArrowLeft, GitBranch, GitMerge, FolderOpen, AlertTriangle, Trash2, FileCode, RefreshCw, HardDrive, Info, Plus, Check, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EnvironmentSelector } from "@/components/EnvironmentSelector";
import { LaunchButton } from "@/components/LaunchButton";
import { ProjectSyncTargets } from "@/components/ProjectSyncTargets";
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
  showCreateWorkspaceProgress?: boolean;
  createWorkspaceStatusLabel?: string;
  onBack: () => void;
  onCreateWorkspace: (branch: string) => Promise<boolean>;
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
  onEnvironmentChange: (environmentId: string | null, binding: EnvironmentBinding) => void;
}

export const ProjectDetail = ({
  project,
  workspaces,
  gitBranches,
  isLoadingBranches,
  isCreatingWorkspace = false,
  showCreateWorkspaceProgress = false,
  createWorkspaceStatusLabel = "Creating workspace...",
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
  const [branchInput, setBranchInput] = useState("");
  const [branchSearchActive, setBranchSearchActive] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const branchInputRef = useRef<HTMLInputElement | null>(null);

  const availableBranches = gitBranches;

  const handleCreateWorkspace = async (branchName: string) => {
    if (isCreatingWorkspace) {
      return;
    }
    const success = await onCreateWorkspace(branchName);
    setBranchInput("");
    setBranchSearchActive(false);
    branchInputRef.current?.blur();
    if (success) {
      setIsCreateDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="hover:bg-secondary"
        >
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

          {project.isGitRepo && (
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={(open) => {
                if (isCreatingWorkspace && !open) {
                  return;
                }
                setIsCreateDialogOpen(open);
              }}
            >
              <DialogTrigger asChild>
                <Button className="gap-2" disabled={isCreatingWorkspace}>
                  <GitBranch className="h-4 w-4" />
                  New Workspace
                </Button>
              </DialogTrigger>
              <DialogContent
                className="sm:max-w-2xl"
                onEscapeKeyDown={(event) => {
                  if (isCreatingWorkspace) {
                    event.preventDefault();
                  }
                }}
                onPointerDownOutside={(event) => {
                  if (isCreatingWorkspace) {
                    event.preventDefault();
                  }
                }}
              >
                <DialogHeader>
                  <DialogTitle>Create New Workspace</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground flex items-start gap-3 shadow-sm">
                    <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">What is a Workspace?</p>
                      <p>
                        A Workspace is an isolated copy of your branch (powered by <strong className="font-semibold text-primary/80">Git Worktrees</strong>).
                        It lets you verify, debug, and work on multiple branches simultaneously without switching context.
                      </p>
                    </div>
                  </div>

                  {showCreateWorkspaceProgress && (
                    <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                      <Loader2 className="mt-0.5 h-4 w-4 animate-spin" />
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{createWorkspaceStatusLabel}</p>
                        <p className="text-xs">Large folders may take time to copy.</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Command className="rounded-lg border border-border bg-background">
                      <CommandInput
                        ref={branchInputRef}
                        placeholder="Search branches..."
                        value={branchInput}
                        disabled={isCreatingWorkspace}
                        onValueChange={setBranchInput}
                        onFocus={() => {
                          if (isCreatingWorkspace) {
                            return;
                          }
                          setBranchSearchActive(true);
                          onLoadBranches?.();
                        }}
                        onBlur={() => setTimeout(() => setBranchSearchActive(false), 120)}
                      />
                      <CommandList className="max-h-60">
                        {isLoadingBranches ? (
                          <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground text-sm">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Fetching branches...
                          </div>
                        ) : (
                          <>
                            <CommandEmpty>No matching branches.</CommandEmpty>
                            <CommandGroup heading="Available branches">
                              {availableBranches.map((branchName) => (
                                <CommandItem
                                  key={branchName}
                                  value={branchName}
                                  onSelect={() => {
                                    if (!isCreatingWorkspace) {
                                      void handleCreateWorkspace(branchName);
                                    }
                                  }}
                                  className={`flex items-center gap-3 py-2.5 px-2 group ${isCreatingWorkspace ? "opacity-60 pointer-events-none" : "cursor-pointer"
                                    }`}
                                >
                                  <div className="flex h-6 w-6 items-center justify-center rounded-md border border-muted bg-background group-data-[selected=true]:border-primary/30 group-data-[selected=true]:bg-primary/10 transition-colors shrink-0">
                                    <GitBranch className="h-3.5 w-3.5 text-muted-foreground group-data-[selected=true]:text-primary transition-colors" />
                                  </div>
                                  <div className="flex-1 min-w-0 grid">
                                    <p className="font-mono text-sm truncate group-data-[selected=true]:text-accent-foreground" title={branchName}>
                                      {branchName}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1.5 pr-1 opacity-0 group-data-[selected=true]:opacity-100 transition-all duration-200">
                                    <span className="text-[10px] font-medium text-primary uppercase tracking-wider">Create</span>
                                    <Plus className="h-3.5 w-3.5 text-primary" />
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </>
                        )}
                      </CommandList>
                    </Command>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Repository Root Card */}
          <Card className="p-4 bg-gradient-card border-primary/20 shadow-sm group">
            <div className="flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1 min-w-0 max-w-[85%]">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-lg text-primary">Repository Root</h3>
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
              </div>

              {/* Footer */}
              <div className="flex items-end gap-3 pt-2 border-t border-border/50">
                <div className="flex-1 min-w-0">
                  <div className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    Environment
                  </div>
                  <EnvironmentSelector
                    environments={environments}
                    value={getEnvironmentIdForTarget(project.path)}
                    targetLabel="Repository Root"
                    minimal
                    onChange={(environmentId) =>
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

                <LaunchButton
                  path={project.path}
                  environmentId={getEnvironmentIdForTarget(project.path)}
                  onLaunch={onOpenInEditor}
                  className="h-9 px-4 text-sm font-medium bg-primary hover:bg-primary/90 shadow-sm shrink-0"
                >
                  <FolderOpen className="mr-2 h-3.5 w-3.5" />
                  Open
                </LaunchButton>
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
                <div className="flex items-start justify-between">
                  <div className="space-y-1 min-w-0 max-w-[85%]">
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

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mr-1 -mt-1 opacity-0 group-hover:opacity-100 transition-all duration-200"
                    onClick={() => onDeleteWorkspace(branch.workspace, branch.name)}
                    title="Delete Workspace"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Footer: Environment + Action */}
                <div className="flex items-end gap-3 pt-2 border-t border-border/50">
                  <div className="flex-1 min-w-0">
                    <div className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                      Environment
                    </div>
                    <EnvironmentSelector
                      environments={environments}
                      value={getEnvironmentIdForTarget(branch.workspace)}
                      targetLabel={`${branch.name} workspace`}
                      minimal
                      onChange={(environmentId) =>
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

                  <LaunchButton
                    path={branch.workspace}
                    environmentId={getEnvironmentIdForTarget(branch.workspace)}
                    onLaunch={onOpenInEditor}
                    className="h-9 px-4 text-sm font-medium bg-primary hover:bg-primary/90 shadow-sm shrink-0"
                  >
                    <FolderOpen className="mr-2 h-3.5 w-3.5" />
                    Open
                  </LaunchButton>
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
                  <p className="font-medium text-foreground">Sync your .env files</p>
                  <p className="text-xs">
                    Files and folders selected here will be automatically copied from <code className="font-mono bg-muted/50 px-1 rounded">{project.path}</code> into every new workspace.
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
