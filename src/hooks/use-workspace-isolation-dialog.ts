import { useEffect, useMemo, useState } from "react";
import { useAppToast } from "@/hooks/use-app-toast";
import { useWorkspaceIsolationManager } from "@/hooks/use-workspace-isolation-manager";
import {
  createEmptyService,
  createWorkspaceIsolationId,
} from "@/lib/workspace-isolation-dialog";
import {
  addDraftConnection,
  addDraftService,
  changeDraftConnection,
  changeDraftService,
  removeDraftConnection,
  removeDraftService,
} from "@/lib/workspace-isolation-dialog-draft";
import { validateWorkspaceIsolationDraft } from "@/lib/workspace-isolation-dialog-validation";
import { normalizeRelativeServicePath } from "@/lib/workspace-isolation-helpers";
import {
  getWorkspaceIsolationDialogOpeningState,
  type WorkspaceIsolationDialogStep,
} from "@/lib/workspace-isolation-dialog-step";
import { applyDerivedWorkspaceIsolationServiceFields } from "@/lib/workspace-isolation-routing";
import {
  createMonorepoDraftServices,
  createSingleAppDraftServices,
  getWorkspaceIsolationMode,
} from "@/lib/workspace-isolation-mode";
import { getWorkspaceIsolationName } from "@/lib/workspace-isolation";
import type {
  WorkspaceIsolationConnection,
  WorkspaceIsolationMode,
  WorkspaceIsolationService,
  WorkspaceIsolationStack,
} from "@/types/workspace-isolation";

interface UseWorkspaceIsolationDialogParams {
  open: boolean;
  projectId: string;
  workspaceRootPath: string;
  workspaceRootLabel: string;
  projectName: string;
  stack?: WorkspaceIsolationStack | null;
  onOpenChange: (open: boolean) => void;
}
export const useWorkspaceIsolationDialog = ({
  open,
  projectId,
  workspaceRootPath,
  workspaceRootLabel,
  projectName,
  stack,
  onOpenChange,
}: UseWorkspaceIsolationDialogParams) => {
  const getDraftServices = (services: WorkspaceIsolationService[]) =>
    applyDerivedWorkspaceIsolationServiceFields(services);
  const { error } = useAppToast();
  const {
    deleteWorkspaceIsolationStack,
    saveWorkspaceIsolationStack,
    shellHookStatus,
    workspaceIsolationStacks,
  } = useWorkspaceIsolationManager();
  const [draftStackId, setDraftStackId] = useState(
    stack?.id ?? createWorkspaceIsolationId(),
  );
  const [draftServices, setDraftServices] = useState<WorkspaceIsolationService[]>(
    [],
  );
  const [draftWorkspaceMode, setDraftWorkspaceMode] =
    useState<WorkspaceIsolationMode>(getWorkspaceIsolationMode(stack));
  const [savedMonorepoServices, setSavedMonorepoServices] = useState<
    WorkspaceIsolationService[]
  >([]);
  const draftName = useMemo(
    () => getWorkspaceIsolationName(projectName, workspaceRootLabel),
    [projectName, workspaceRootLabel],
  );
  const [step, setStep] = useState<WorkspaceIsolationDialogStep>(1);
  const [requiresAutoEnvSetup, setRequiresAutoEnvSetup] = useState(false);
  const [isOpenInitialized, setIsOpenInitialized] = useState(false);

  useEffect(() => {
    if (!open) {
      setRequiresAutoEnvSetup(false);
      setIsOpenInitialized(false);
      return;
    }
    if (isOpenInitialized) {
      return;
    }
    if (stack) {
      const openingState = getWorkspaceIsolationDialogOpeningState(
        stack,
        shellHookStatus,
      );
      setDraftStackId(stack.id);
      setDraftWorkspaceMode(getWorkspaceIsolationMode(stack));
      setDraftServices(getDraftServices(stack.services.map((service) => ({ ...service }))));
      setSavedMonorepoServices(stack.services.map((service) => ({ ...service })));
      setStep(openingState.step);
      setRequiresAutoEnvSetup(openingState.requiresAutoEnvSetup);
      setIsOpenInitialized(true);
      return;
    }
    const openingState = getWorkspaceIsolationDialogOpeningState(
      null,
      shellHookStatus,
    );
    setDraftStackId(createWorkspaceIsolationId());
    setDraftWorkspaceMode("monorepo");
    setDraftServices(
      getDraftServices([createEmptyService([], workspaceIsolationStacks)]),
    );
    setSavedMonorepoServices([]);
    setStep(openingState.step);
    setRequiresAutoEnvSetup(openingState.requiresAutoEnvSetup);
    setIsOpenInitialized(true);
  }, [open, stack, workspaceIsolationStacks, isOpenInitialized, shellHookStatus]);

  const handleNextStep = () => {
    if (step === 1) {
      setStep(2);
      return;
    }
    for (const service of draftServices) {
      if (!service.name.trim()) {
        error({ title: "Name Required", description: "Service name cannot be empty." });
        return;
      }
      if (
        draftWorkspaceMode === "monorepo" &&
        normalizeRelativeServicePath(service.relativePath) === "."
      ) {
        error({
          title: "Relative Path Required",
          description: "Relative folder path cannot be empty. Use a path like app/api.",
        });
        return;
      }
    }
    setStep(3);
  };
  const handleContinueToConfiguration = () => setStep(2);
  const handlePrevStep = () => setStep((currentStep) => (currentStep === 3 ? 2 : 1));
  const handleAddService = () =>
    setDraftServices((current) =>
      addDraftService(current, workspaceIsolationStacks),
    );
  const handleChangeService = (
    serviceId: string,
    updates: Partial<WorkspaceIsolationService>,
  ) =>
    setDraftServices((current) => changeDraftService(current, serviceId, updates));
  const handleRemoveService = (serviceId: string) =>
    setDraftServices((current) => removeDraftService(current, serviceId, draftStackId));
  const handleAddConnection = (serviceId: string) =>
    setDraftServices((current) => addDraftConnection(current, serviceId));
  const handleChangeConnection = (
    serviceId: string,
    linkId: string,
    updates: Partial<WorkspaceIsolationConnection>,
  ) =>
    setDraftServices((current) => changeDraftConnection(current, serviceId, linkId, updates));
  const handleRemoveConnection = (serviceId: string, linkId: string) =>
    setDraftServices((current) => removeDraftConnection(current, serviceId, linkId));
  const handleWorkspaceModeChange = (workspaceMode: WorkspaceIsolationMode) => {
    if (workspaceMode === draftWorkspaceMode) {
      return;
    }
    if (workspaceMode === "single-app") {
      setSavedMonorepoServices(draftServices.map((service) => ({ ...service })));
      setDraftServices(
        getDraftServices(
          createSingleAppDraftServices(draftServices, workspaceIsolationStacks),
        ),
      );
      setDraftWorkspaceMode("single-app");
      return;
    }
    setDraftWorkspaceMode("monorepo");
    setDraftServices(
      getDraftServices(
        createMonorepoDraftServices(
          savedMonorepoServices,
          workspaceIsolationStacks,
        ),
      ),
    );
  };
  const handleSave = async () => {
    const result = validateWorkspaceIsolationDraft(
      draftName,
      draftStackId,
      draftWorkspaceMode,
      draftServices,
    );
    if ("error" in result) {
      error(result.error);
      return;
    }
    const saveResult = await saveWorkspaceIsolationStack({
      id: draftStackId,
      name: result.name,
      projectId,
      workspaceRootPath,
      workspaceRootLabel,
      projectName,
      workspaceMode: draftWorkspaceMode,
      services: result.services,
    });
    if (!saveResult.success) {
      error({
        title: "Save failed",
        description: saveResult.error ?? "Failed to save Workspace Isolation.",
      });
      return;
    }
    onOpenChange(false);
  };
  const handleDelete = async () => {
    if (!stack) return;
    const deleteResult = await deleteWorkspaceIsolationStack(stack.id);
    if (!deleteResult.success) {
      error({
        title: "Delete failed",
        description: deleteResult.error ?? "Failed to remove Workspace Isolation.",
      });
      return;
    }
    onOpenChange(false);
  };
  return {
    step,
    requiresAutoEnvSetup,
    draftServices,
    draftStackId,
    draftWorkspaceMode,
    workspaceIsolationStacks,
    handleContinueToConfiguration,
    handleNextStep,
    handlePrevStep,
    handleAddService,
    handleChangeService,
    handleRemoveService,
    handleAddConnection,
    handleChangeConnection,
    handleRemoveConnection,
    handleWorkspaceModeChange,
    handleSave,
    handleDelete,
  };
};
