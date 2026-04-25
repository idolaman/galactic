import type {
  WorkspaceIsolationActivationTargetKind,
  WorkspaceIsolationStateViewedState,
  WorkspaceIsolationSupportAnalyticsSummary,
} from "../lib/workspace-isolation-analytics.js";
import { trackAnalyticsEvent } from "./analytics.js";

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
