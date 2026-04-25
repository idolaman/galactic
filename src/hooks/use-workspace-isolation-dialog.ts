import { useEffect, useMemo, useState } from "react";
import { useAppToast } from "@/hooks/use-app-toast";
import { useWorkspaceIsolationManager } from "@/hooks/use-workspace-isolation-manager";
import { useWorkspaceIsolationReloadToast } from "@/hooks/use-workspace-isolation-reload-toast";
import {
  getWorkspaceIsolationAnalyticsAutoEnvState,
  getWorkspaceIsolationAnalyticsOpeningStep,
  getWorkspaceIsolationAnalyticsSummary,
} from "@/lib/workspace-isolation-analytics";
import {
  getInitialWorkspaceActivationTargetPath,
  getSelectableWorkspaceActivationTargets,
  getWorkspaceActivationButtonLabel,
  getWorkspaceActivationTarget,
  shouldOfferWorkspaceActivation,
} from "@/lib/workspace-isolation-activation";
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
import { shouldShowWorkspaceIsolationTopologyEditReloadToast } from "@/lib/workspace-isolation-support";
import { applyDerivedWorkspaceIsolationServiceFields } from "@/lib/workspace-isolation-routing";
import {
  createMonorepoDraftServices,
  createSingleAppDraftServices,
  getWorkspaceIsolationMode,
} from "@/lib/workspace-isolation-mode";
import { getWorkspaceIsolationName } from "@/lib/workspace-isolation";
import { getWorkspaceIsolationProxyStatus } from "@/services/workspace-isolation";
import {
  trackWorkspaceIsolationActivationCompleted,
  trackWorkspaceIsolationActivationOffered,
  trackWorkspaceIsolationActivationSkipped,
  trackWorkspaceIsolationConfigurationAdvanced,
  trackWorkspaceIsolationDialogOpened,
  trackWorkspaceIsolationDeleted,
  trackWorkspaceIsolationIntroContinued,
  trackWorkspaceIsolationSaved,
} from "@/services/workspace-isolation-analytics";
import type {
  WorkspaceActivationTarget,
  WorkspaceIsolationConnection,
  WorkspaceIsolationMode,
  WorkspaceIsolationProjectTopology,
  WorkspaceIsolationService,
} from "@/types/workspace-isolation";
import type { WorkspaceIsolationProxyStatus } from "@/types/electron";

interface UseWorkspaceIsolationDialogParams {
  open: boolean;
  projectId: string;
  workspaceRootPath: string;
  workspaceRootLabel: string;
  projectName: string;
  activationTargets: WorkspaceActivationTarget[];
  stack?: WorkspaceIsolationProjectTopology | null;
  onOpenChange: (open: boolean) => void;
}

const getDraftServices = (services: WorkspaceIsolationService[]) =>
  applyDerivedWorkspaceIsolationServiceFields(services);

const defaultProxyStatus: WorkspaceIsolationProxyStatus = {
  running: false,
  port: 1355,
};

export const useWorkspaceIsolationDialog = ({
  open,
  projectId,
  workspaceRootPath,
  workspaceRootLabel,
  projectName,
  activationTargets,
  stack,
  onOpenChange,
}: UseWorkspaceIsolationDialogParams) => {
  const { error } = useAppToast();
  const {
    enableWorkspaceIsolationForWorkspace,
    deleteWorkspaceIsolationProjectTopology,
    markWorkspaceIsolationIntroSeen,
    saveWorkspaceIsolationProjectTopology,
    shellHookStatus,
    workspaceIsolationIntroSeen,
    workspaceIsolationProjectTopologies,
    workspaceIsolationStacks,
  } = useWorkspaceIsolationManager();
  const { showTopologyEditReloadToast } = useWorkspaceIsolationReloadToast();
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
  const [isActivatingSelectedWorkspace, setIsActivatingSelectedWorkspace] =
    useState(false);
  const [selectedActivationTargetPath, setSelectedActivationTargetPath] =
    useState<string | null>(null);
  const [proxyStatus, setProxyStatus] =
    useState<WorkspaceIsolationProxyStatus>(defaultProxyStatus);
  const draftName = useMemo(
    () => getWorkspaceIsolationName(projectName, workspaceRootLabel),
    [projectName, workspaceRootLabel],
  );
  const selectableActivationTargets = useMemo(
    () => getSelectableWorkspaceActivationTargets(activationTargets),
    [activationTargets],
  );
  const selectedActivationTarget = useMemo(
    () =>
      getWorkspaceActivationTarget(
        selectableActivationTargets,
        selectedActivationTargetPath,
      ) ?? selectableActivationTargets[0] ?? null,
    [selectableActivationTargets, selectedActivationTargetPath],
  );
  const activationButtonLabel = useMemo(
    () =>
      getWorkspaceActivationButtonLabel(
        selectedActivationTarget?.label ?? null,
      ),
    [selectedActivationTarget],
  );

  useEffect(() => {
    if (!open) {
      setIsOpenInitialized(false);
      setShowFeatureIntroStep(false);
      setSelectedActivationTargetPath(null);
      setIsActivatingSelectedWorkspace(false);
      setProxyStatus(defaultProxyStatus);
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
    setSelectedActivationTargetPath(
      getInitialWorkspaceActivationTargetPath(activationTargets),
    );
    setStep(openingState.step);
    setShowFeatureIntroStep(openingState.showFeatureIntroStep);
    trackWorkspaceIsolationDialogOpened(
      Boolean(stack),
      getWorkspaceIsolationAnalyticsOpeningStep(openingState.step),
      getWorkspaceIsolationAnalyticsAutoEnvState(shellHookStatus),
      "project-dialog",
    );
    void getWorkspaceIsolationProxyStatus()
      .then(setProxyStatus)
      .catch(() => setProxyStatus(defaultProxyStatus));
    setIsOpenInitialized(true);
  }, [
    activationTargets,
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
    const isEditing = Boolean(stack);
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
          "Failed to save Project Services.",
      });
      return;
    }
    trackWorkspaceIsolationSaved(
      isEditing,
      getWorkspaceIsolationAnalyticsAutoEnvState(shellHookStatus),
      getWorkspaceIsolationAnalyticsSummary(
        draftStackId,
        draftWorkspaceMode,
        result.services,
      ),
    );
    if (shouldShowWorkspaceIsolationTopologyEditReloadToast({
      isEditing,
      shellHookStatus,
      activationTargets,
    })) {
      showTopologyEditReloadToast();
    }
    if (shouldOfferWorkspaceActivation(isEditing, activationTargets)) {
      const nextTarget = selectedActivationTarget ?? selectableActivationTargets[0];
      if (nextTarget) {
        setSelectedActivationTargetPath(nextTarget.path);
        trackWorkspaceIsolationActivationOffered({
          source: "project-dialog",
          targetKind: nextTarget.kind,
          isFirstTimeSetup: true,
        });
        setStep(5);
        return;
      }
    }
    onOpenChange(false);
  };

  const handleSelectActivationTarget = (path: string) =>
    setSelectedActivationTargetPath(path);

  const handleActivateSelectedWorkspace = async () => {
    if (!selectedActivationTarget) {
      return;
    }

    setIsActivatingSelectedWorkspace(true);
    try {
      const result = await enableWorkspaceIsolationForWorkspace({
        projectId,
        projectName,
        workspaceRootPath: selectedActivationTarget.path,
        workspaceRootLabel: selectedActivationTarget.label,
      });
      trackWorkspaceIsolationActivationCompleted({
        source: "project-dialog",
        targetKind: selectedActivationTarget.kind,
        isFirstTimeSetup: true,
        success: result.success,
      });
      if (!result.success) {
        error({
          title: "Activation failed",
          description:
            result.error ??
            `Failed to activate Project Services for ${selectedActivationTarget.label}.`,
        });
        return;
      }
      onOpenChange(false);
    } finally {
      setIsActivatingSelectedWorkspace(false);
    }
  };

  const handleFinishWithoutActivation = () => {
    if (selectedActivationTarget) {
      trackWorkspaceIsolationActivationSkipped({
        source: "project-dialog",
        targetKind: selectedActivationTarget.kind,
        isFirstTimeSetup: true,
      });
    }
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
          "Failed to remove Project Services.",
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
    activationButtonLabel,
    isActivatingSelectedWorkspace,
    proxyStatus,
    shellHookStatus,
    selectableActivationTargets,
    selectedActivationTargetPath,
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
    handleSelectActivationTarget,
    handleActivateSelectedWorkspace,
    handleFinishWithoutActivation,
  };
};
