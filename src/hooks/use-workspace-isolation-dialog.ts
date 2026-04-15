import { useEffect, useMemo, useState } from "react";
import { useAppToast } from "@/hooks/use-app-toast";
import { useWorkspaceIsolationManager } from "@/hooks/use-workspace-isolation-manager";
import {
  getWorkspaceIsolationAnalyticsAutoEnvState,
  getWorkspaceIsolationAnalyticsOpeningStep,
  getWorkspaceIsolationAnalyticsSummary,
} from "@/lib/workspace-isolation-analytics";
import { createEmptyService } from "@/lib/workspace-isolation-dialog";
import {
  addDraftConnection,
  addDraftService,
  changeDraftConnection,
  changeDraftService,
  removeDraftConnection,
  removeDraftService,
} from "@/lib/workspace-isolation-dialog-draft";
import { validateWorkspaceIsolationDraft } from "@/lib/workspace-isolation-dialog-validation";
import {
  getWorkspaceIsolationTopologyId,
  normalizeRelativeServicePath,
} from "@/lib/workspace-isolation-helpers";
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
import {
  trackWorkspaceIsolationConfigurationAdvanced,
  trackWorkspaceIsolationDialogOpened,
  trackWorkspaceIsolationDeleted,
  trackWorkspaceIsolationIntroContinued,
  trackWorkspaceIsolationSaved,
} from "@/services/workspace-isolation-analytics";
import type {
  WorkspaceIsolationConnection,
  WorkspaceIsolationMode,
  WorkspaceIsolationProjectTopology,
  WorkspaceIsolationService,
} from "@/types/workspace-isolation";

interface UseWorkspaceIsolationDialogParams {
  open: boolean;
  projectId: string;
  workspaceRootPath: string;
  workspaceRootLabel: string;
  projectName: string;
  stack?: WorkspaceIsolationProjectTopology | null;
  onOpenChange: (open: boolean) => void;
}

const getDraftServices = (services: WorkspaceIsolationService[]) =>
  applyDerivedWorkspaceIsolationServiceFields(services);

export const useWorkspaceIsolationDialog = ({
  open,
  projectId,
  workspaceRootPath,
  workspaceRootLabel,
  projectName,
  stack,
  onOpenChange,
}: UseWorkspaceIsolationDialogParams) => {
  const { error } = useAppToast();
  const {
    deleteWorkspaceIsolationProjectTopology,
    markWorkspaceIsolationIntroSeen,
    saveWorkspaceIsolationProjectTopology,
    shellHookStatus,
    workspaceIsolationIntroSeen,
    workspaceIsolationProjectTopologies,
    workspaceIsolationStacks,
  } = useWorkspaceIsolationManager();
  const topologyId = getWorkspaceIsolationTopologyId(projectId);
  const draftStackId = stack?.id ?? topologyId;
  const [draftServices, setDraftServices] = useState<WorkspaceIsolationService[]>(
    [],
  );
  const [draftWorkspaceMode, setDraftWorkspaceMode] =
    useState<WorkspaceIsolationMode>(getWorkspaceIsolationMode(stack));
  const [savedMonorepoServices, setSavedMonorepoServices] = useState<
    WorkspaceIsolationService[]
  >([]);
  const [step, setStep] = useState<WorkspaceIsolationDialogStep>(3);
  const [showFeatureIntroStep, setShowFeatureIntroStep] = useState(false);
  const [isOpenInitialized, setIsOpenInitialized] = useState(false);
  const draftName = useMemo(
    () => getWorkspaceIsolationName(projectName, workspaceRootLabel),
    [projectName, workspaceRootLabel],
  );

  useEffect(() => {
    if (!open) {
      setIsOpenInitialized(false);
      setShowFeatureIntroStep(false);
      return;
    }
    if (isOpenInitialized) {
      return;
    }

    const openingState = getWorkspaceIsolationDialogOpeningState(
      shellHookStatus,
      workspaceIsolationIntroSeen,
    );
    if (stack) {
      setDraftWorkspaceMode(getWorkspaceIsolationMode(stack));
      setDraftServices(getDraftServices(stack.services.map((service) => ({ ...service }))));
      setSavedMonorepoServices(stack.services.map((service) => ({ ...service })));
    } else {
      setDraftWorkspaceMode("monorepo");
      setDraftServices(
        getDraftServices([createEmptyService([], workspaceIsolationStacks)]),
      );
      setSavedMonorepoServices([]);
    }
    setStep(openingState.step);
    setShowFeatureIntroStep(openingState.showFeatureIntroStep);
    trackWorkspaceIsolationDialogOpened(
      Boolean(stack),
      getWorkspaceIsolationAnalyticsOpeningStep(openingState.step),
      getWorkspaceIsolationAnalyticsAutoEnvState(shellHookStatus),
    );
    setIsOpenInitialized(true);
  }, [
    open,
    stack,
    isOpenInitialized,
    shellHookStatus,
    workspaceIsolationIntroSeen,
    workspaceIsolationStacks,
    topologyId,
  ]);

  const handleFeatureIntroContinue = () => {
    trackWorkspaceIsolationIntroContinued(
      getWorkspaceIsolationAnalyticsAutoEnvState(shellHookStatus),
    );
    setStep(2);
    void markWorkspaceIsolationIntroSeen();
  };

  const handleContinueToConfiguration = () => setStep(3);

  const handleContinueToConnections = () => {
    for (const service of draftServices) {
      if (!service.name.trim()) {
        error({
          title: "Name Required",
          description: "Service name cannot be empty.",
        });
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
    trackWorkspaceIsolationConfigurationAdvanced(
      Boolean(stack),
      getWorkspaceIsolationAnalyticsSummary(
        draftStackId,
        draftWorkspaceMode,
        draftServices,
      ),
    );
    setStep(4);
  };

  const handleBackToFeatureIntro = () => setStep(1);
  const handlePrevStep = () => setStep(3);

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
    setDraftServices((current) =>
      removeDraftService(current, serviceId, draftStackId),
    );

  const handleAddConnection = (serviceId: string) =>
    setDraftServices((current) => addDraftConnection(current, serviceId));

  const handleChangeConnection = (
    serviceId: string,
    linkId: string,
    updates: Partial<WorkspaceIsolationConnection>,
  ) =>
    setDraftServices((current) =>
      changeDraftConnection(current, serviceId, linkId, updates),
    );

  const handleRemoveConnection = (serviceId: string, linkId: string) =>
    setDraftServices((current) =>
      removeDraftConnection(current, serviceId, linkId),
    );

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
    const saveResult = await saveWorkspaceIsolationProjectTopology({
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
        description:
          saveResult.error ??
          "Failed to save Workspace Isolation project services.",
      });
      return;
    }
    trackWorkspaceIsolationSaved(
      Boolean(stack),
      getWorkspaceIsolationAnalyticsAutoEnvState(shellHookStatus),
      getWorkspaceIsolationAnalyticsSummary(
        draftStackId,
        draftWorkspaceMode,
        result.services,
      ),
    );
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!stack) {
      return;
    }
    const deleteResult = await deleteWorkspaceIsolationProjectTopology(stack.id);
    if (!deleteResult.success) {
      error({
        title: "Delete failed",
        description:
          deleteResult.error ??
          "Failed to remove Workspace Isolation project services.",
      });
      return;
    }
    trackWorkspaceIsolationDeleted(
      getWorkspaceIsolationAnalyticsSummary(
        stack.id,
        stack.workspaceMode,
        stack.services,
      ),
    );
    onOpenChange(false);
  };

  return {
    step,
    showFeatureIntroStep,
    draftServices,
    draftStackId,
    draftWorkspaceMode,
    workspaceIsolationProjectTopologies,
    workspaceIsolationStacks,
    handleFeatureIntroContinue,
    handleContinueToConfiguration,
    handleContinueToConnections,
    handleBackToFeatureIntro,
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
