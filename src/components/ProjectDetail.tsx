import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, GitBranch, GitMerge, Trash2, FolderOpen, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Branch {
  name: string;
  worktree?: string;
}

interface ProjectDetailProps {
  project: {
    name: string;
    path: string;
    currentBranch: string;
  };
  branches: Branch[];
  onBack: () => void;
  onCreateWorktree: (branch: string) => void;
  onConvertToBase: (worktree: string) => void;
  onOpenInEditor: (path: string) => void;
}

export const ProjectDetail = ({ 
  project, 
  branches, 
  onBack, 
  onCreateWorktree,
  onConvertToBase,
  onOpenInEditor 
}: ProjectDetailProps) => {
  const worktrees = branches.filter(b => b.worktree);
  const availableBranches = branches.filter(b => !b.worktree);

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
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-primary" />
              <Badge variant="secondary" className="font-mono">
                {project.currentBranch}
              </Badge>
            </div>
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

      {/* Active Worktrees */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <GitMerge className="h-6 w-6 text-primary" />
          Active Worktrees
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {worktrees.map((branch) => (
            <Card 
              key={branch.worktree}
              className="p-6 bg-gradient-card border-primary/30 shadow-glow"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge className="mb-2 bg-primary/20 text-primary border-primary/30 font-mono">
                      {branch.name}
                    </Badge>
                    <code className="text-xs text-muted-foreground block">
                      {branch.worktree}
                    </code>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => onOpenInEditor(branch.worktree!)}
                    className="flex-1 bg-primary hover:bg-primary-glow transition-all duration-300"
                  >
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Open
                  </Button>
                  
                  <Button 
                    variant="destructive"
                    size="icon"
                    onClick={() => {
                      if (confirm("Convert this worktree back to base code?")) {
                        onConvertToBase(branch.worktree!);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <Alert className="bg-warning/10 border-warning/30">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <AlertDescription className="text-xs text-warning">
                    Converting to base will merge changes and remove worktree
                  </AlertDescription>
                </Alert>
              </div>
            </Card>
          ))}
        </div>

        {worktrees.length === 0 && (
          <Card className="p-8 bg-secondary/50 border-border text-center">
            <GitMerge className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No active worktrees</p>
          </Card>
        )}
      </div>

      {/* Available Branches */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <GitBranch className="h-6 w-6 text-primary" />
          Available Branches
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {availableBranches.map((branch) => (
            <Card 
              key={branch.name}
              className="p-4 bg-gradient-card border-border hover:border-primary/50 transition-all duration-300 cursor-pointer group"
              onClick={() => onCreateWorktree(branch.name)}
            >
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="font-mono group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                  {branch.name}
                </Badge>
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Create Worktree
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
