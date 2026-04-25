import { useEffect, useMemo, useRef, useState } from "react";
import { useAppToast } from "@/hooks/use-app-toast";
import { useWorkspaceIsolationManager } from "@/hooks/use-workspace-isolation-manager";
import { resolveWorkspaceIsolationConnections } from "@/lib/workspace-isolation-connection-proof";
import { getWorkspaceIsolationServicesOpenState } from "@/lib/workspace-networking-panel";
import { getWorkspaceIsolationWorkspaceStatus } from "@/lib/workspace-isolation-status";
import { getWorkspaceIsolationProxyStatus } from "@/services/workspace-isolation";

interface UseWorkspaceNetworkingPanelParams {
  projectId: string;
  workspacePath: string;
}

export const useWorkspaceNetworkingPanel = ({
  projectId,
  workspacePath,
}: UseWorkspaceNetworkingPanelParams) => {
  const { error } = useAppToast();
  const {
    workspaceIsolationForWorkspace,
    workspaceIsolationProjectTopologies,
    workspaceIsolationStacks,
    workspaceIsolationTopologyForProject,
    shellHookStatus,
  } = useWorkspaceIsolationManager();
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [proxyStatus, setProxyStatus] = useState<Awaited<ReturnType<typeof getWorkspaceIsolationProxyStatus>> | null>(null);
  const topology = workspaceIsolationTopologyForProject(projectId);
  const realStack = workspaceIsolationForWorkspace(workspacePath);
  const previousStackIdRef = useRef<string | null>(realStack?.id ?? null);
  const connectionProofs = useMemo(
    () =>
      realStack
        ? realStack.services.flatMap((service) =>
            resolveWorkspaceIsolationConnections({
              service,
              workspaceIsolationProjectTopologies,
              workspaceIsolationStacks,
            }),
          )
        : [],
    [realStack, workspaceIsolationProjectTopologies, workspaceIsolationStacks],
  );
  const status = useMemo(
    () =>
      getWorkspaceIsolationWorkspaceStatus({
        connectionProofs,
        proxyStatus,
        shellHookStatus,
        stack: realStack,
        topology,
      }),
    [connectionProofs, proxyStatus, realStack, shellHookStatus, topology],
  );

  const refreshProxyStatus = async () => {
    try {
      setProxyStatus(await getWorkspaceIsolationProxyStatus());
    } catch {
      error({
        title: "Support status unavailable",
        description: "Unable to load the Project Services proxy status.",
      });
    }
  };

  useEffect(() => {
    void refreshProxyStatus();
  }, []);

  useEffect(() => {
    const nextStackId = realStack?.id ?? null;
    setIsServicesOpen((currentOpen) =>
      getWorkspaceIsolationServicesOpenState(
        previousStackIdRef.current,
        nextStackId,
        currentOpen,
      ),
    );
    previousStackIdRef.current = nextStackId;
  }, [realStack?.id]);

  return {
    isServicesOpen,
    realStack,
    refreshProxyStatus,
    setIsServicesOpen,
    status,
  };
};
