import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, GitBranch, GitMerge, Trash2, FolderOpen, AlertTriangle, Bug } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface Branch {
  name: string;
  workspace?: string;
}

interface ProjectDetailProps {
  project: {
    name: string;
    path: string;
    currentBranch?: string | null;
    isGitRepo: boolean;
  };
  branches: Branch[];
  environments: string[];
  onBack: () => void;
  onCreateWorkspace: (branch: string) => void;
  onDebugInMain: (workspace: string, branch: string) => void;
  onOpenInEditor: (path: string) => void;
  onEnvironmentChange: (workspace: string, env: string) => void;
}

export const ProjectDetail = ({ 
  project, 
  branches, 
  environments,
  onBack, 
  onCreateWorkspace,
  onDebugInMain,
  onOpenInEditor,
  onEnvironmentChange
}: ProjectDetailProps) => {
  const [branchInput, setBranchInput] = useState("");
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
  
  const workspaces = branches.filter(b => b.workspace);
  const availableBranches = branches.filter(b => !b.workspace);

  const handleBranchInputChange = (value: string) => {
    setBranchInput(value);
    if (value) {
      const filtered = availableBranches.filter(b => 
        b.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredBranches(filtered);
    } else {
      setFilteredBranches([]);
    }
  };

  const handleCreateWorkspace = (branchName: string) => {
    onCreateWorkspace(branchName);
    setBranchInput("");
    setFilteredBranches([]);
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

      {/* Main Codebase */}
      <Card className="p-6 bg-gradient-card border-border shadow-card">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Main Codebase</h2>
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
          
          <Button 
            onClick={() => onOpenInEditor(project.path)}
            className="bg-primary hover:bg-primary-glow transition-all duration-300"
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            Open in Editor
          </Button>
        </div>
      </Card>

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
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Environment</label>
                  <Select onValueChange={(value) => onEnvironmentChange(branch.workspace!, value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select environment" />
                    </SelectTrigger>
                    <SelectContent>
                      {environments.map((env) => (
                        <SelectItem key={env} value={env}>
                          {env}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => onOpenInEditor(branch.workspace!)}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Move to
                  </Button>
                  
                  <Button 
                    variant="secondary"
                    onClick={() => onDebugInMain(branch.workspace!, branch.name)}
                    className="flex-1"
                  >
                    <Bug className="mr-2 h-4 w-4" />
                    Debug in Main
                  </Button>
                </div>
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
            <div className="relative">
              <Input
                placeholder="Type branch name..."
                value={branchInput}
                onChange={(e) => handleBranchInputChange(e.target.value)}
                className="w-full"
              />
              {filteredBranches.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredBranches.map((branch) => (
                    <div
                      key={branch.name}
                      className="p-3 hover:bg-accent cursor-pointer flex items-center justify-between"
                      onClick={() => handleCreateWorkspace(branch.name)}
                    >
                      <Badge variant="secondary" className="font-mono">
                        {branch.name}
                      </Badge>
                      <span className="text-xs text-muted-foreground">Click to create</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Start typing to search branches, then click to create a workspace
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
