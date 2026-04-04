import { useEffect, useMemo, useState } from "react";
import { useAppToast } from "@/hooks/use-app-toast";
import { useServiceStackManager } from "@/hooks/use-service-stack-manager";
import { createEmptyService, createMockId } from "@/lib/service-stack-dialog";
import { addDraftConnection, addDraftService, changeDraftConnection, changeDraftService, removeDraftConnection, removeDraftService } from "@/lib/service-stack-dialog-draft";
import { validateServiceStackDraft } from "@/lib/service-stack-dialog-validation";
import { normalizeRelativeServicePath } from "@/lib/service-stack-mock";
import { applyDerivedServiceFields } from "@/lib/service-stack-routing";
import { createMonorepoDraftServices, createSingleAppDraftServices, getServiceStackWorkspaceMode } from "@/lib/service-stack-workspace-mode";
import { getWorkspaceIsolationName } from "@/lib/workspace-isolation";
import type { ServiceStackConnection, ServiceStackEnvironment, ServiceStackService, ServiceStackWorkspaceMode } from "@/types/service-stack";

interface UseServiceStackDialogParams {
  open: boolean;
  projectId: string;
  workspaceRootPath: string;
  workspaceRootLabel: string;
  projectName: string;
  stack?: ServiceStackEnvironment | null;
  onOpenChange: (open: boolean) => void;
}
export const useServiceStackDialog = ({
  open,
  projectId,
  workspaceRootPath,
  workspaceRootLabel,
  projectName,
  stack,
  onOpenChange,
}: UseServiceStackDialogParams) => {
  const getDraftServices = (services: ServiceStackService[]) =>
    applyDerivedServiceFields(services);
  const { error } = useAppToast();
  const { deleteServiceStack, saveServiceStack, serviceStacks } = useServiceStackManager();
  const [draftStackId, setDraftStackId] = useState(stack?.id ?? createMockId());
  const [draftServices, setDraftServices] = useState<ServiceStackService[]>([]);
  const [draftWorkspaceMode, setDraftWorkspaceMode] = useState<ServiceStackWorkspaceMode>(
    getServiceStackWorkspaceMode(stack),
  );
  const [savedMonorepoServices, setSavedMonorepoServices] = useState<ServiceStackService[]>([]);
  const draftName = useMemo(() => getWorkspaceIsolationName(projectName, workspaceRootLabel), [projectName, workspaceRootLabel]);
  const [step, setStep] = useState<1 | 2>(1);
  useEffect(() => {
    if (!open) {
      return;
    }
    if (stack) {
      setDraftStackId(stack.id);
      setDraftWorkspaceMode(getServiceStackWorkspaceMode(stack));
      setDraftServices(getDraftServices(stack.services.map((service) => ({ ...service }))));
      setSavedMonorepoServices(stack.services.map((service) => ({ ...service })));
      setStep(1);
      return;
    }
    setDraftStackId(createMockId());
    setDraftWorkspaceMode("monorepo");
    setDraftServices(getDraftServices([createEmptyService([], serviceStacks)]));
    setSavedMonorepoServices([]);
    setStep(1);
  }, [open, serviceStacks, stack]);
  const handleNextStep = () => {
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
    setStep(2);
  };
  const handlePrevStep = () => setStep(1);
  const handleAddService = () =>
    setDraftServices((current) => addDraftService(current, serviceStacks));
  const handleChangeService = (serviceId: string, updates: Partial<ServiceStackService>) =>
    setDraftServices((current) => changeDraftService(current, serviceId, updates));
  const handleRemoveService = (serviceId: string) =>
    setDraftServices((current) => removeDraftService(current, serviceId, draftStackId));
  const handleAddConnection = (serviceId: string) =>
    setDraftServices((current) => addDraftConnection(current, serviceId));
  const handleChangeConnection = (
    serviceId: string,
    linkId: string,
    updates: Partial<ServiceStackConnection>,
  ) =>
    setDraftServices((current) => changeDraftConnection(current, serviceId, linkId, updates));
  const handleRemoveConnection = (serviceId: string, linkId: string) =>
    setDraftServices((current) => removeDraftConnection(current, serviceId, linkId));
  const handleWorkspaceModeChange = (workspaceMode: ServiceStackWorkspaceMode) => {
    if (workspaceMode === draftWorkspaceMode) {
      return;
    }
    if (workspaceMode === "single-app") {
      setSavedMonorepoServices(draftServices.map((service) => ({ ...service })));
      setDraftServices(getDraftServices(createSingleAppDraftServices(draftServices, serviceStacks)));
      setDraftWorkspaceMode("single-app");
      return;
    }
    setDraftWorkspaceMode("monorepo");
    setDraftServices(getDraftServices(createMonorepoDraftServices(savedMonorepoServices, serviceStacks)));
  };
  const handleSave = () => {
    const result = validateServiceStackDraft(
      draftName,
      draftStackId,
      draftWorkspaceMode,
      draftServices,
    );
    if ("error" in result) {
      error(result.error);
      return;
    }
    saveServiceStack({
      id: draftStackId,
      name: result.name,
      projectId,
      workspaceRootPath,
      workspaceRootLabel,
      projectName,
      workspaceMode: draftWorkspaceMode,
      services: result.services,
    });
    onOpenChange(false);
  };
  const handleDelete = () => {
    if (!stack) return;
    deleteServiceStack(stack.id);
    onOpenChange(false);
  };
  return {
    step,
    draftServices,
    draftStackId,
    draftWorkspaceMode,
    serviceStacks,
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
