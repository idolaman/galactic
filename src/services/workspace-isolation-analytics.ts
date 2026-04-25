import type {
  WorkspaceIsolationActivationTargetKind,
  WorkspaceIsolationAnalyticsAutoEnvState,
  WorkspaceIsolationAnalyticsOpeningStep,
  WorkspaceIsolationAnalyticsSource,
  WorkspaceIsolationStateViewedState,
  WorkspaceIsolationAnalyticsSummary,
  WorkspaceIsolationSupportAnalyticsSummary,
} from "../lib/workspace-isolation-analytics.js";
import { trackAnalyticsEvent } from "./analytics.js";

export const trackWorkspaceIsolationDialogOpened = (
  isEdit: boolean,
  openingStep: WorkspaceIsolationAnalyticsOpeningStep,
  autoEnvState: WorkspaceIsolationAnalyticsAutoEnvState,
  source: WorkspaceIsolationAnalyticsSource = "workspace-card",
): void => {
  trackAnalyticsEvent("WorkspaceIsolation.dialogOpened", {
    isEdit,
    openingStep,
    autoEnvState,
    source,
  });
};

export const trackWorkspaceIsolationInfoDialogOpened = (): void => {
  trackAnalyticsEvent("WorkspaceIsolation.infoDialogOpened", {
    source: "settings-info",
  });
};

export const trackWorkspaceIsolationIntroContinued = (
  autoEnvState: WorkspaceIsolationAnalyticsAutoEnvState,
): void => {
  trackAnalyticsEvent("WorkspaceIsolation.introContinued", {
    autoEnvState,
    source: "onboarding",
  });
};

export const trackWorkspaceIsolationAutoEnvEnableAttempted = (
  source: WorkspaceIsolationAnalyticsSource,
): void => {
  trackAnalyticsEvent("WorkspaceIsolation.autoEnvEnableAttempted", { source });
};

export const trackWorkspaceIsolationAutoEnvEnableCompleted = (
  source: WorkspaceIsolationAnalyticsSource,
  success: boolean,
): void => {
  trackAnalyticsEvent("WorkspaceIsolation.autoEnvEnableCompleted", {
    source,
    success,
  });
};

export const trackWorkspaceIsolationConfigurationAdvanced = (
  isEdit: boolean,
  summary: WorkspaceIsolationAnalyticsSummary,
): void => {
  trackAnalyticsEvent("WorkspaceIsolation.configurationAdvanced", {
    isEdit,
    ...summary,
  });
};

export const trackWorkspaceIsolationSaved = (
  isEdit: boolean,
  autoEnvState: WorkspaceIsolationAnalyticsAutoEnvState,
  summary: WorkspaceIsolationAnalyticsSummary,
): void => {
  trackAnalyticsEvent("WorkspaceIsolation.saved", {
    isEdit,
    autoEnvState,
    ...summary,
  });
};

export const trackWorkspaceIsolationDeleted = (
  summary: WorkspaceIsolationAnalyticsSummary,
): void => {
  trackAnalyticsEvent("WorkspaceIsolation.deleted", {
    serviceCount: summary.serviceCount,
    connectionCount: summary.connectionCount,
  });
};

export const trackWorkspaceIsolationActivationOffered = (input: {
  source: WorkspaceIsolationAnalyticsSource;
  targetKind: WorkspaceIsolationActivationTargetKind;
  isFirstTimeSetup: boolean;
}): void => {
  trackAnalyticsEvent("WorkspaceIsolation.activationOffered", input);
};

export const trackWorkspaceIsolationActivationCompleted = (input: {
  source: WorkspaceIsolationAnalyticsSource;
  targetKind: WorkspaceIsolationActivationTargetKind;
  isFirstTimeSetup: boolean;
}): void => {
  trackAnalyticsEvent("WorkspaceIsolation.activationCompleted", input);
};

export const trackWorkspaceIsolationActivationSkipped = (input: {
  source: WorkspaceIsolationAnalyticsSource;
  targetKind: WorkspaceIsolationActivationTargetKind;
  isFirstTimeSetup: boolean;
}): void => {
  trackAnalyticsEvent("WorkspaceIsolation.activationSkipped", input);
};

export const trackWorkspaceIsolationWorkspaceStateViewed = (input: {
  state: WorkspaceIsolationStateViewedState;
} & WorkspaceIsolationSupportAnalyticsSummary): void => {
  trackAnalyticsEvent("WorkspaceIsolation.workspaceStateViewed", { ...input });
};

export const trackWorkspaceIsolationProofDrawerOpened = (
  input: WorkspaceIsolationSupportAnalyticsSummary,
): void => {
  trackAnalyticsEvent("WorkspaceIsolation.proofDrawerOpened", { ...input });
};

export const trackWorkspaceIsolationLegacyBridgeOpened = (input: {
  targetKind: WorkspaceIsolationActivationTargetKind;
}): void => {
  trackAnalyticsEvent("WorkspaceIsolation.legacyBridgeOpened", input);
};

export const trackWorkspaceIsolationLegacyBridgeSelected = (input: {
  targetKind: WorkspaceIsolationActivationTargetKind;
  hasEnvironment: boolean;
}): void => {
  trackAnalyticsEvent("WorkspaceIsolation.legacyBridgeSelected", input);
};
