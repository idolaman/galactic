import type {
  WorkspaceIsolationAnalyticsAutoEnvState,
  WorkspaceIsolationAnalyticsOpeningStep,
  WorkspaceIsolationAnalyticsSource,
  WorkspaceIsolationAnalyticsSummary,
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
