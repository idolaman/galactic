import { useState } from "react";
import { useCreateWorkspaceBaseBranches } from "@/hooks/use-create-workspace-base-branches";
import {
  resolveCreateWorkspaceDialogVisibilityChange,
  shouldClearSelectedBaseBranch,
  shouldClearSelectedWorkspaceBranch,
} from "@/lib/create-workspace-flow";
import type {
  CreateWorkspaceStep,
  UseCreateWorkspaceDialogOptions,
} from "@/types/create-workspace-dialog";

export const useCreateWorkspaceDialog = ({
  projectPath,
  isCreatingWorkspace,
  onCreateWorkspace,
  onLoadBranches,
}: UseCreateWorkspaceDialogOptions) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<CreateWorkspaceStep>("branch");
  const [branchInput, setBranchInput] = useState("");
  const [selectedExistingBranch, setSelectedExistingBranch] = useState("");
  const [pendingNewBranch, setPendingNewBranch] = useState("");
  const [baseBranchInput, setBaseBranchInput] = useState("");
  const [selectedBaseBranch, setSelectedBaseBranch] = useState("");
  const [isClosingAfterCreate, setIsClosingAfterCreate] = useState(false);
  const {
    baseBranches,
    isLoadingBaseBranches,
    loadBaseBranches,
    resetBaseBranches,
  } = useCreateWorkspaceBaseBranches(projectPath);
  const resetDialog = () => {
    setStep("branch");
    setBranchInput("");
    setSelectedExistingBranch("");
    setPendingNewBranch("");
    setBaseBranchInput("");
    setSelectedBaseBranch("");
    resetBaseBranches();
  };

  const handleOpenChange = (open: boolean) => {
    if ((isCreatingWorkspace || isClosingAfterCreate) && !open) return;
    const visibilityChange = resolveCreateWorkspaceDialogVisibilityChange(open);
    if (visibilityChange.shouldResetDialog) resetDialog();
    setIsOpen(open);
    if (visibilityChange.shouldLoadBranches) {
      onLoadBranches?.();
      void loadBaseBranches();
    }
  };

  const closeAfterCreate = () => {
    setIsClosingAfterCreate(true);
    setIsOpen(false);
  };

  const handleCreateFromExisting = async (branchName: string) => {
    if (isCreatingWorkspace || isClosingAfterCreate) return;
    const success = await onCreateWorkspace({ branch: branchName });
    if (success) closeAfterCreate();
  };

  const handleCreateFromNew = async () => {
    const isBlocked =
      isCreatingWorkspace ||
      isClosingAfterCreate ||
      isLoadingBaseBranches ||
      !pendingNewBranch;
    if (isBlocked) return;
    const success = await onCreateWorkspace({
      branch: pendingNewBranch,
      createBranch: true,
      startPoint: selectedBaseBranch,
    });
    if (success) closeAfterCreate();
  };

  const handleDialogExitComplete = () => {
    if (!isOpen) setIsClosingAfterCreate(false);
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
    handleDialogExitComplete,
    handleOpenChange,
    isClosingAfterCreate,
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
