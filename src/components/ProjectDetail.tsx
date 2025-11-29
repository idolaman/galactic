import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, GitBranch, GitMerge, FolderOpen, AlertTriangle, Trash2, FileCode, X, Loader2, RefreshCw, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { useEffect, useRef, useState } from "react";
import type { Workspace } from "@/types/workspace";
import type { Environment, EnvironmentBinding } from "@/types/environment";
import { EnvironmentSelector } from "@/components/EnvironmentSelector";
import { workspaceNeedsRelaunch, clearWorkspaceRelaunchFlag } from "@/services/workspace-state";

interface ProjectDetailProps {
  project: {
    id: string;
    name: string;
    path: string;
    isGitRepo: boolean;
  };
  workspaces: Workspace[];
  gitBranches: string[];
  onBack: () => void;
  onCreateWorkspace: (branch: string) => void;
  onOpenInEditor: (path: string) => void;
  onLoadBranches?: () => void | Promise<void>;
  onDeleteWorkspace: (workspacePath: string, branch: string) => void;
  configFiles: string[];
  fileSearchResults: string[];
  isSearchingFiles: boolean;
  onSearchFiles: (query: string) => void;
  onAddConfigFile: (filePath: string) => void;
  onRemoveConfigFile: (filePath: string) => void;
  environments: Environment[];
  getEnvironmentIdForTarget: (targetPath: string) => string | null;
  onEnvironmentChange: (environmentId: string | null, binding: EnvironmentBinding) => void;
}

interface LaunchButtonProps {
  path: string;
  onLaunch: (path: string) => void;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "secondary" | "ghost" | "destructive" | "outline" | "link";
}

const LaunchButton = ({
  path,
  onLaunch,
  children,
  className,
  variant = "default",
}: LaunchButtonProps) => {
  const [showDialog, setShowDialog] = useState(false);
  const needsRelaunch = workspaceNeedsRelaunch(path);

  const handleLaunch = () => {
    onLaunch(path);
    clearWorkspaceRelaunchFlag(path);
    setShowDialog(false);
  };

  if (!needsRelaunch) {
    return (
      <Button
        onClick={handleLaunch}
        className={className}
        variant={variant}
      >
        {children}
      </Button>
    );
  }

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        className={cn(className, "bg-orange-600 hover:bg-orange-700 text-white border-orange-700")}
        variant={variant}
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Relaunch
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Relaunch Required</AlertDialogTitle>
            <AlertDialogDescription>
              To apply environment changes, you must manually close the existing editor window for this project.
              <br />
              <br />
              Once closed, click <strong>Launch</strong> to re-open it with the new settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="secondary"
              onClick={() => onLaunch(path)}
            >
              Focus Window
            </Button>
            <AlertDialogAction onClick={handleLaunch}>
              Launch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export const ProjectDetail = ({
  project,
  workspaces,
  gitBranches,
  onBack,
  onCreateWorkspace,
  onOpenInEditor,
  onLoadBranches,
  onDeleteWorkspace,
  configFiles,
  fileSearchResults,
  isSearchingFiles,
  onSearchFiles,
  onAddConfigFile,
  onRemoveConfigFile,
  environments,
  getEnvironmentIdForTarget,
  onEnvironmentChange,
}: ProjectDetailProps) => {
  const [branchInput, setBranchInput] = useState("");
  const [branchSearchActive, setBranchSearchActive] = useState(false);
  const branchInputRef = useRef<HTMLInputElement | null>(null);
  const [fileSearchInput, setFileSearchInput] = useState("");
  const [fileSearchActive, setFileSearchActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fileQueryTooShort = fileSearchInput.trim().length < 2;
  const hasConfigFiles = configFiles.length > 0;

  const availableBranches = gitBranches;

  const handleCreateWorkspace = (branchName: string) => {
    onCreateWorkspace(branchName);
    setBranchInput("");
    setBranchSearchActive(false);
    branchInputRef.current?.blur();
  };

  const handleConfigFileSelect = (filePath: string) => {
    if (!filePath || configFiles.includes(filePath)) {
      return;
    }
    onAddConfigFile(filePath);
    setFileSearchInput("");
    setFileSearchActive(false);
    fileInputRef.current?.blur();
  };

  useEffect(() => {
    const trimmed = fileSearchInput.trim();
    if (trimmed.length < 2) {
      onSearchFiles("");
      return;
    }
    const timeout = setTimeout(() => {
      onSearchFiles(trimmed);
    }, 250);
    return () => clearTimeout(timeout);
  }, [fileSearchInput, onSearchFiles]);

  useEffect(() => {
    setFileSearchInput("");
    setFileSearchActive(false);
  }, [project.path]);

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

      {/* Workspaces Section (Base Code + Worktrees) */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <GitMerge className="h-6 w-6 text-primary" />
          Workspaces
        </h2>
        
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
                  onLaunch={onOpenInEditor}
                  className="h-9 px-4 text-sm font-medium bg-primary hover:bg-primary/90 shadow-sm shrink-0"
                >
                  <FolderOpen className="mr-2 h-3.5 w-3.5" />
                  Open
                </LaunchButton>
              </div>
            </div>
          </Card>

          {/* Active Workspaces */}
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
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-mono text-sm py-1 px-2.5 rounded-md">
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
          {/* Create New Workspace */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <GitBranch className="h-6 w-6 text-primary" />
              Create Workspace
            </h2>
            
            <Card className="p-4 bg-card border-border">
              <div className="space-y-3">
                <Command className="rounded-lg border border-border bg-background">
                  <CommandInput
                    ref={branchInputRef}
                    placeholder="Search branches..."
                    value={branchInput}
                    onValueChange={setBranchInput}
                    onFocus={() => {
                      setBranchSearchActive(true);
                      onLoadBranches?.();
                    }}
                    onBlur={() => setTimeout(() => setBranchSearchActive(false), 120)}
                  />
                  <CommandList className={`max-h-60 ${branchSearchActive ? "" : "hidden"}`}>
                    <CommandEmpty>No matching branches.</CommandEmpty>
                    <CommandGroup heading="Available branches">
                      {availableBranches.map((branchName) => (
                        <CommandItem
                          key={branchName}
                          value={branchName}
                          onSelect={() => handleCreateWorkspace(branchName)}
                          className="flex items-center justify-between"
                        >
                          <Badge variant="secondary" className="font-mono">
                            {branchName}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">Create workspace</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
                <p className="text-xs text-muted-foreground">
                  Start typing to search branches from this project, then pick one to create a workspace.
                </p>
              </div>
            </Card>
          </div>

          {/* Config file sync */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FileCode className="h-6 w-6 text-primary" />
              Workspace Config Sync
            </h2>

            <Card className="p-4 bg-card border-border">
              <div className="space-y-3">
                <Command className="rounded-lg border border-border bg-background">
                  <CommandInput
                    ref={fileInputRef}
                    placeholder="Search files to copy..."
                    value={fileSearchInput}
                    onValueChange={setFileSearchInput}
                    onFocus={() => setFileSearchActive(true)}
                    onBlur={() => setTimeout(() => setFileSearchActive(false), 120)}
                  />
                  <CommandList
                    className={`max-h-60 ${
                      fileSearchActive && !fileQueryTooShort ? "" : "hidden"
                    }`}
                  >
                    <CommandEmpty>
                      {isSearchingFiles ? (
                        <span className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Searching files...
                        </span>
                      ) : (
                        "No matching files"
                      )}
                    </CommandEmpty>
                    <CommandGroup heading="Matching files">
                      {fileSearchResults.map((filePath) => {
                        const alreadyAdded = configFiles.includes(filePath);
                        return (
                          <CommandItem
                            key={filePath}
                            value={filePath}
                            onSelect={() => !alreadyAdded && handleConfigFileSelect(filePath)}
                            className={`flex items-center justify-between ${
                              alreadyAdded ? "opacity-50" : ""
                            }`}
                          >
                            <code className="text-xs font-mono truncate max-w-[280px]">{filePath}</code>
                            {alreadyAdded ? (
                              <Badge variant="secondary" className="text-[11px]">
                                Added
                              </Badge>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">Add file</span>
                            )}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
                <p className="text-xs text-muted-foreground">
                  Choose files from the repository root that should be copied into every new worktree. Type at
                  least two characters to search.
                </p>

                {hasConfigFiles ? (
                  <div className="flex flex-wrap gap-2">
                    {configFiles.map((file) => (
                      <div
                        key={file}
                        className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2 py-1"
                      >
                        <code className="text-xs">{file}</code>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-muted-foreground hover:text-foreground"
                          onClick={() => onRemoveConfigFile(file)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No files selected yet. Add files above to keep local configuration in sync.
                  </p>
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
