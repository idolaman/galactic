import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, GitBranch, GitMerge, FolderOpen, AlertTriangle, Bug, Trash2, FileCode, X, Loader2, RefreshCw } from "lucide-react";
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
    currentBranch?: string | null;
    isGitRepo: boolean;
  };
  workspaces: Workspace[];
  gitBranches: string[];
  onBack: () => void;
  onCreateWorkspace: (branch: string) => void;
  onDebugInMain: (workspace: string, branch: string) => void;
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
  onDebugInMain,
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

      {/* Base Code */}
      <Card className="p-6 bg-gradient-card border-border shadow-card">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3 flex-1">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Base Code</h2>
                {project.isGitRepo ? (
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-primary" />
                    <Badge variant="secondary" className="font-mono">
                      {project.currentBranch ?? "HEAD"}
                    </Badge>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    <span>Git is not initialized for this folder.</span>
                  </div>
                )}
              </div>
              
              <LaunchButton
                path={project.path}
                onLaunch={onOpenInEditor}
                className="bg-primary hover:bg-primary-glow transition-all duration-300"
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                Open in Editor
              </LaunchButton>
            </div>

            <EnvironmentSelector
              environments={environments}
              value={getEnvironmentIdForTarget(project.path)}
              targetLabel="the base code"
              onChange={(environmentId) =>
                onEnvironmentChange(environmentId, {
                  projectId: project.id,
                  projectName: project.name,
                  targetPath: project.path,
                  targetLabel: "Base Code",
                  kind: "base",
                })
              }
            />
          </div>
        </div>
      </Card>

      {project.isGitRepo && (
        <>
          {/* Active Workspaces */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <GitMerge className="h-6 w-6 text-primary" />
              Active Workspaces
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {workspaces.map((branch) => (
                <Card 
                  key={branch.workspace}
                  className="p-6 bg-card border-primary/30"
                >
                  <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge className="mb-2 bg-primary/20 text-primary border-primary/30 font-mono">
                      {branch.name}
                    </Badge>
                    <code className="text-xs text-muted-foreground block">
                      {branch.workspace}
                    </code>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDeleteWorkspace(branch.workspace, branch.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  </div>

                    <div className="flex gap-2">
                      <LaunchButton
                        path={branch.workspace}
                        onLaunch={onOpenInEditor}
                        className="flex-1 bg-primary hover:bg-primary/90"
                      >
                        <FolderOpen className="mr-2 h-4 w-4" />
                        Move to
                      </LaunchButton>
                      
                      <Button 
                        variant="secondary"
                    onClick={() => onDebugInMain(branch.workspace, branch.name)}
                        className="flex-1"
                      >
                        <Bug className="mr-2 h-4 w-4" />
                        Debug in Base Code
                      </Button>
                    </div>

                    <EnvironmentSelector
                      environments={environments}
                      value={getEnvironmentIdForTarget(branch.workspace)}
                      targetLabel={`${branch.name} workspace`}
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
                </Card>
              ))}
            </div>

            {workspaces.length === 0 && (
              <Card className="p-8 bg-secondary/50 border-border text-center">
                <GitMerge className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No active workspaces</p>
              </Card>
            )}
          </div>

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
                  Choose files from the base code that should be copied into every new worktree. Type at
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
