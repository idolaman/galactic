import { DEFAULT_HOOK_STATUSES, type HookId, type HookStatusMap } from "@/types/hook-status";

type HookStatusListener = () => void;

const listeners = new Set<HookStatusListener>();
let hookStatuses: HookStatusMap = { ...DEFAULT_HOOK_STATUSES };

const notifyListeners = () => {
  listeners.forEach((listener) => listener());
};

const setHookStatuses = (nextStatuses: Partial<HookStatusMap>) => {
  hookStatuses = { ...DEFAULT_HOOK_STATUSES, ...nextStatuses };
  notifyListeners();
};

export const getHookStatusSnapshot = (): HookStatusMap => {
  return hookStatuses;
};

export const subscribeToHookStatusChanges = (listener: HookStatusListener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const refreshHookStatuses = async (): Promise<HookStatusMap> => {
  if (!window.electronAPI?.getHookStatuses) {
    setHookStatuses(DEFAULT_HOOK_STATUSES);
    return hookStatuses;
  }

  try {
    const nextStatuses = await window.electronAPI.getHookStatuses();
    setHookStatuses(nextStatuses);
  } catch (error) {
    console.warn("Failed to refresh hook statuses", error);
  }
  return hookStatuses;
};

export const installHook = async (hookId: HookId): Promise<{ success: boolean; error?: string }> => {
  if (!window.electronAPI?.installHook) {
    return { success: false, error: "Hook installation is unavailable." };
  }

  const result = await window.electronAPI.installHook(hookId);
  if (result.success) {
    await refreshHookStatuses();
  }
  return result;
};
