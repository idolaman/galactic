import { useEffect, useRef } from "react";
import type { WorkspaceIsolationWorkspaceStatus } from "@/lib/workspace-isolation-status";
import {
  trackWorkspaceIsolationProofDrawerOpened,
  trackWorkspaceIsolationWorkspaceStateViewed,
} from "@/services/workspace-isolation-analytics";
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

  useEffect(() => {
    if (!status) {
      return;
    }
    const key = `${workspacePath}:${status.state}`;
    if (previousTrackedStateRef.current === key) {
      return;
    }
    trackWorkspaceIsolationWorkspaceStateViewed({
      state: status.state,
      targetKind,
      hasDependencies: status.hasDependencies,
      hasNonLiveDependencies: status.hasNonLiveDependencies,
    });
    previousTrackedStateRef.current = key;
  }, [status, targetKind, workspacePath]);

  useEffect(() => {
    if (isServicesOpen && !previousDrawerOpenRef.current && status) {
      trackWorkspaceIsolationProofDrawerOpened({
        targetKind,
        hasDependencies: status.hasDependencies,
        hasNonLiveDependencies: status.hasNonLiveDependencies,
      });
    }
    previousDrawerOpenRef.current = isServicesOpen;
  }, [isServicesOpen, status, targetKind]);
};
