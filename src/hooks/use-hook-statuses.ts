import { useEffect, useSyncExternalStore } from "react";
import { getHookStatusSnapshot, refreshHookStatuses, subscribeToHookStatusChanges } from "@/services/hook-status";
import { DEFAULT_HOOK_STATUSES } from "@/types/hook-status";

export const useHookStatuses = () => {
  const statuses = useSyncExternalStore(
    subscribeToHookStatusChanges,
    getHookStatusSnapshot,
    () => DEFAULT_HOOK_STATUSES,
  );

  useEffect(() => {
    void refreshHookStatuses();
  }, []);

  return statuses;
};
