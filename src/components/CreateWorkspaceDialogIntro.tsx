import { Info } from "lucide-react";

export const CreateWorkspaceDialogIntro = () => {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground shadow-sm">
      <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
      <p>
        A Workspace is an isolated copy of your branch (Git Worktrees), so you
        can work on multiple branches in parallel.
      </p>
    </div>
  );
};
