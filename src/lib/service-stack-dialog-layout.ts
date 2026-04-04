import type { ServiceStackWorkspaceMode } from "../types/service-stack.js";

export const SERVICE_STACK_DIALOG_CONTENT_CLASS_NAME =
  "flex h-[78vh] max-h-[42rem] max-w-3xl flex-col";

export const isSingleAppOverviewStep = (
  step: 1 | 2,
  workspaceMode: ServiceStackWorkspaceMode,
): boolean => step === 1 && workspaceMode === "single-app";
