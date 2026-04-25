import { useEffect, useMemo, useRef } from "react";
import type { WorkspaceIsolationWorkspaceStatus } from "@/lib/workspace-isolation-status";
import {
  getWorkspaceIsolationSupportAnalyticsFingerprint,
  getWorkspaceIsolationSupportAnalyticsSummary,
} from "@/lib/workspace-isolation-analytics";
import {
  trackWorkspaceIsolationProofDrawerOpened,
  trackWorkspaceIsolationWorkspaceStateViewed,
} from "@/services/workspace-isolation-support-analytics";
import type { WorkspaceActivationTargetKind } from "@/types/workspace-isolation";

interface UseWorkspaceNetworkingAnalyticsParams {
  isServicesOpen: boolean;
  status: WorkspaceIsolationWorkspaceStatus | null;
  targetKind: WorkspaceActivationTargetKind;
  workspacePath: string;
}

export const useWorkspaceNetworkingAnalytics = ({
  isServicesOpen,
  status,
  targetKind,
  workspacePath,
}: UseWorkspaceNetworkingAnalyticsParams) => {
  const previousDrawerOpenRef = useRef(false);
  const previousTrackedStateRef = useRef<string | null>(null);
  const supportSummary = useMemo(
    () =>
      status
        ? getWorkspaceIsolationSupportAnalyticsSummary(targetKind, status)
        : null,
    [status, targetKind],
  );

  useEffect(() => {
    if (!status || !supportSummary) {
      return;
    }
    const key = getWorkspaceIsolationSupportAnalyticsFingerprint(
      workspacePath,
      status,
    );
    if (previousTrackedStateRef.current === key) {
      return;
    }
    trackWorkspaceIsolationWorkspaceStateViewed({
      state: status.state,
      ...supportSummary,
    });
    previousTrackedStateRef.current = key;
  }, [status, supportSummary, workspacePath]);

  useEffect(() => {
    if (isServicesOpen && !previousDrawerOpenRef.current && supportSummary) {
      trackWorkspaceIsolationProofDrawerOpened(supportSummary);
    }
    previousDrawerOpenRef.current = isServicesOpen;
  }, [isServicesOpen, supportSummary]);
};
