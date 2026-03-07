import { useCallback, useEffect, useMemo, useState } from "react";
import { projectStorage } from "@/services/projects";
import { hookPlatformOptions } from "@/services/hook-platforms";
import type { HookPlatform, HookPlatformStatus } from "@/types/hooks";
import { markAllWorkspacesRequireRelaunch } from "@/services/workspace-state";

interface ToastPayload {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

const getProjectPaths = () => {
  return projectStorage.load().flatMap((project) => [
    project.path,
    ...(project.workspaces?.map((workspace) => workspace.workspace) ?? []),
  ]);
};

export const useHookPlatforms = (toast: (payload: ToastPayload) => void) => {
  const [statuses, setStatuses] = useState<Record<HookPlatform, HookPlatformStatus>>({} as Record<HookPlatform, HookPlatformStatus>);
  const [installing, setInstalling] = useState<Record<HookPlatform, boolean>>({} as Record<HookPlatform, boolean>);

  const refreshStatuses = useCallback(async () => {
    const nextStatuses = await Promise.all(
      hookPlatformOptions.map(async (platform) => [
        platform.id,
        await window.electronAPI?.getHookStatus?.(platform.id),
      ] as const),
    );
    setStatuses(Object.fromEntries(nextStatuses) as Record<HookPlatform, HookPlatformStatus>);
  }, []);

  useEffect(() => {
    void refreshStatuses();
  }, [refreshStatuses]);

  const installPlatform = useCallback(async (platform: HookPlatform) => {
    setInstalling((current) => ({ ...current, [platform]: true }));
    try {
      const result = await window.electronAPI?.installHooks?.(platform);
      if (!result?.success) {
        toast({ title: `${platform} setup failed`, description: result?.error, variant: "destructive" });
        return;
      }
      toast({
        title: result.mode === "manual" ? `${platform} assets prepared` : `${platform} hooks installed`,
        description: result.manualSteps?.join("\n"),
      });
      markAllWorkspacesRequireRelaunch(getProjectPaths());
      await refreshStatuses();
    } finally {
      setInstalling((current) => ({ ...current, [platform]: false }));
    }
  }, [refreshStatuses, toast]);

  return useMemo(() => ({ installPlatform, installing, statuses }), [installPlatform, installing, statuses]);
};
