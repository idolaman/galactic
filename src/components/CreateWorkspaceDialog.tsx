import { useState } from "react";
import { GitBranch } from "lucide-react";
import { CreateWorkspaceBranchPicker } from "@/components/CreateWorkspaceBranchPicker";
import { CreateWorkspaceDialogIntro } from "@/components/CreateWorkspaceDialogIntro";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  shouldLoadBranchesOnFocus,
  shouldResetBranchSearchSession,
} from "@/lib/branch-search-focus";
import type { CreateWorkspaceRequest } from "@/lib/create-workspace-request";
import { getCurrentBranch } from "@/services/git";
interface CreateWorkspaceDialogProps {
  projectPath: string;
  gitBranches: string[];
  isLoadingBranches?: boolean;
  isCreatingWorkspace?: boolean;
  showCreateWorkspaceProgress?: boolean;
  createWorkspaceStatusLabel?: string;
  onCreateWorkspace: (request: CreateWorkspaceRequest) => Promise<boolean>;
  onLoadBranches?: () => void | Promise<void>;
  onClearBranches?: () => void;
}
export const CreateWorkspaceDialog = ({
  projectPath,
  gitBranches,
  isLoadingBranches = false,
  isCreatingWorkspace = false,
  showCreateWorkspaceProgress = false,
  createWorkspaceStatusLabel = "Creating workspace...",
  onCreateWorkspace,
  onLoadBranches,
  onClearBranches,
}: CreateWorkspaceDialogProps) => {
  const [branchInput, setBranchInput] = useState("");
  const [branchSearchActive, setBranchSearchActive] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasFetchedBranchesThisOpen, setHasFetchedBranchesThisOpen] =
    useState(false);
  const [currentProjectBranch, setCurrentProjectBranch] = useState<
    string | null
  >(null);
  const [currentBranchError, setCurrentBranchError] = useState<string | null>(
    null,
  );
  const [isLoadingCurrentBranch, setIsLoadingCurrentBranch] = useState(false);
  const loadBranchesIfNeeded = () => {
    if (
      shouldLoadBranchesOnFocus({
        hasFetchedBranchesThisOpen,
        isCreatingWorkspace,
      })
    ) {
      setHasFetchedBranchesThisOpen(true);
      onLoadBranches?.();
      setIsLoadingCurrentBranch(true);
      setCurrentBranchError(null);
      void getCurrentBranch(projectPath)
        .then((result) => {
          if (result.success && result.branch) {
            setCurrentProjectBranch(result.branch);
            return;
          }

          setCurrentProjectBranch(null);
          setCurrentBranchError(
            result.error ?? "Unable to resolve current branch.",
          );
        })
        .catch((error) => {
          setCurrentProjectBranch(null);
          setCurrentBranchError(
            error instanceof Error
              ? error.message
              : "Unable to resolve current branch.",
          );
        })
        .finally(() => {
          setIsLoadingCurrentBranch(false);
        });
    }
  };

  const resetSession = () => {
    setBranchInput("");
    setBranchSearchActive(false);
    setHasFetchedBranchesThisOpen(false);
    setCurrentProjectBranch(null);
    setCurrentBranchError(null);
    setIsLoadingCurrentBranch(false);
    onClearBranches?.();
  };

  const handleCreateFromExisting = async (branchName: string) => {
    if (isCreatingWorkspace) return;
    const success = await onCreateWorkspace({ branch: branchName });
    if (success) setIsOpen(false);
  };

  const handleCreateFromNew = async (
    branchName: string,
    startPoint: string,
  ) => {
    if (isCreatingWorkspace || isLoadingBranches) return;
    const success = await onCreateWorkspace({
      branch: branchName,
      createBranch: true,
      startPoint,
    });
    if (success) setIsOpen(false);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (isCreatingWorkspace && !open) return;
        setIsOpen(open);
        if (open) loadBranchesIfNeeded();
        if (shouldResetBranchSearchSession({ open })) resetSession();
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
        onEscapeKeyDown={(event) =>
          isCreatingWorkspace && event.preventDefault()
        }
        onPointerDownOutside={(event) =>
          isCreatingWorkspace && event.preventDefault()
        }
      >
        <DialogHeader>
          <DialogTitle>Create New Workspace</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <CreateWorkspaceDialogIntro />
          <CreateWorkspaceBranchPicker
            branchInput={branchInput}
            branchSearchActive={branchSearchActive}
            currentBranchError={currentBranchError}
            currentProjectBranch={currentProjectBranch}
            gitBranches={gitBranches}
            isCreatingWorkspace={isCreatingWorkspace}
            isDialogOpen={isOpen}
            isLoadingBranches={isLoadingBranches}
            isLoadingCurrentBranch={isLoadingCurrentBranch}
            onBranchInputChange={setBranchInput}
            onBranchSearchActiveChange={setBranchSearchActive}
            onLoadBranches={loadBranchesIfNeeded}
            onSelectBranch={(branch) => void handleCreateFromExisting(branch)}
            onCreateNewBranch={(branch, startPoint) =>
              void handleCreateFromNew(branch, startPoint)
            }
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
