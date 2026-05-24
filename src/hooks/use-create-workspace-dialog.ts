import { useRef, useState } from "react";
import type { CreateWorkspaceRequest } from "@/lib/create-workspace-request";
import {
  resolveCreateWorkspaceDialogVisibilityChange,
  shouldClearSelectedBaseBranch,
  shouldClearSelectedWorkspaceBranch,
} from "@/lib/create-workspace-flow";
import { listBranches } from "@/services/git";

interface UseCreateWorkspaceDialogOptions {
  projectPath: string;
  isCreatingWorkspace: boolean;
  onCreateWorkspace: (request: CreateWorkspaceRequest) => Promise<boolean>;
  onLoadBranches?: () => void | Promise<void>;
}

type CreateWorkspaceStep = "branch" | "base";

export const useCreateWorkspaceDialog = ({
  projectPath,
  isCreatingWorkspace,
  onCreateWorkspace,
  onLoadBranches,
}: UseCreateWorkspaceDialogOptions) => {
  const requestIdRef = useRef(0);
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<CreateWorkspaceStep>("branch");
  const [branchInput, setBranchInput] = useState("");
  const [selectedExistingBranch, setSelectedExistingBranch] = useState("");
  const [pendingNewBranch, setPendingNewBranch] = useState("");
  const [baseBranchInput, setBaseBranchInput] = useState("");
  const [selectedBaseBranch, setSelectedBaseBranch] = useState("");
  const [baseBranches, setBaseBranches] = useState<string[]>([]);
  const [isLoadingBaseBranches, setIsLoadingBaseBranches] = useState(false);

  const resetDialog = () => {
    requestIdRef.current += 1;
    setStep("branch");
    setBranchInput("");
    setSelectedExistingBranch("");
    setPendingNewBranch("");
    setBaseBranchInput("");
    setSelectedBaseBranch("");
    setBaseBranches([]);
    setIsLoadingBaseBranches(false);
  };

  const loadBaseBranches = async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoadingBaseBranches(true);
    try {
      const branches = await listBranches(projectPath, { scope: "local" });
      if (requestIdRef.current === requestId) {
        setBaseBranches(branches);
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setIsLoadingBaseBranches(false);
      }
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (isCreatingWorkspace && !open) return;
    const visibilityChange = resolveCreateWorkspaceDialogVisibilityChange(open);
    if (visibilityChange.shouldResetDialog) {
      resetDialog();
    }
    setIsOpen(open);
    if (visibilityChange.shouldLoadBranches) {
      onLoadBranches?.();
      void loadBaseBranches();
    }
  };

  const handleCreateFromExisting = async (branchName: string) => {
    if (isCreatingWorkspace) return;
    const success = await onCreateWorkspace({ branch: branchName });
    if (success) setIsOpen(false);
  };

  const handleCreateFromNew = async () => {
    if (isCreatingWorkspace || isLoadingBaseBranches || !pendingNewBranch) return;
    const success = await onCreateWorkspace({
      branch: pendingNewBranch,
      createBranch: true,
      startPoint: selectedBaseBranch,
    });
    if (success) setIsOpen(false);
  };

  const handleBaseBranchInputChange = (value: string) => {
    setBaseBranchInput(value);
    if (shouldClearSelectedBaseBranch(value, selectedBaseBranch)) {
      setSelectedBaseBranch("");
    }
  };

  const handleBranchInputChange = (value: string) => {
    setBranchInput(value);
    if (shouldClearSelectedWorkspaceBranch(value, selectedExistingBranch)) {
      setSelectedExistingBranch("");
    }
  };

  const handleSelectExistingBranch = (branch: string) => {
    setSelectedExistingBranch(branch);
    setBranchInput(branch);
  };

  return {
    baseBranchInput,
    baseBranches,
    branchInput,
    handleBaseBranchInputChange,
    handleBranchInputChange,
    handleCreateFromExisting,
    handleCreateFromNew,
    handleOpenChange,
    isLoadingBaseBranches,
    isOpen,
    pendingNewBranch,
    selectedExistingBranch,
    selectedBaseBranch,
    setBaseBranchInput,
    setPendingNewBranch: (branch: string) => {
      setPendingNewBranch(branch);
      setSelectedExistingBranch("");
      setBaseBranchInput("");
      setSelectedBaseBranch("");
      setStep("base");
    },
    setSelectedExistingBranch: handleSelectExistingBranch,
    setSelectedBaseBranch: (branch: string) => {
      setSelectedBaseBranch(branch);
      setBaseBranchInput(branch);
    },
    setStep,
    step,
  };
};
