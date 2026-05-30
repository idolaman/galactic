import { GLOBAL_LOCAL_STORAGE_KEYS } from "@/services/local-storage-keys";
import { getLocalStorage } from "@/services/local-storage-scope";

// Types
type UpdateStatus = "available" | "downloaded" | "not-available" | "error";

export interface UpdateEventPayload {
  status: UpdateStatus;
  version?: string;
  message?: string;
  releaseDate?: string;
}

export interface CheckUpdateResult {
  supported: boolean;
  updateAvailable?: boolean;
  version?: string | null;
  message?: string;
  error?: string;
}

export interface ApplyUpdateResult {
  success: boolean;
  error?: string;
}

// Type guard
const isUpdateStatus = (value: string): value is UpdateStatus =>
  value === "available" ||
  value === "downloaded" ||
  value === "not-available" ||
  value === "error";

// API functions
export async function checkForUpdates(): Promise<CheckUpdateResult> {
  if (typeof window === "undefined") {
    return { supported: false, message: "Updates require the desktop app." };
  }

  try {
    const result = await window.electronAPI?.checkForUpdates?.();
    return result ?? { supported: false, message: "Update bridge unavailable." };
  } catch (error) {
    return {
      supported: true,
      updateAvailable: false,
      error: error instanceof Error ? error.message : "Failed to check for updates.",
    };
  }
}

export async function applyUpdate(): Promise<ApplyUpdateResult> {
  if (typeof window === "undefined") {
    return { success: false, error: "Updates require the desktop app." };
  }

  try {
    const result = await window.electronAPI?.applyUpdate?.();
    return result ?? { success: false, error: "Update bridge unavailable." };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to install update.",
    };
  }
}

export function subscribeToUpdateEvents(
  handler: (payload: UpdateEventPayload) => void,
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const unsubscribe = window.electronAPI?.onUpdateEvent?.((status, payload) => {
    if (!isUpdateStatus(status)) return;
    handler({
      status,
      version: typeof payload?.version === "string" ? payload.version : undefined,
      message: typeof payload?.message === "string" ? payload.message : undefined,
      releaseDate: typeof payload?.releaseDate === "string" ? payload.releaseDate : undefined,
    });
  });

  return unsubscribe ?? (() => {});
}

// Toast dismissal tracking (localStorage-based cooldown)
const COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours

export function setUpdateToastDismissed(): void {
  const storage = getLocalStorage();
  if (!storage) return;

  try {
    storage.setItem(GLOBAL_LOCAL_STORAGE_KEYS.updateToastDismissed, Date.now().toString());
  } catch (error) {
    console.warn("Failed to save update toast dismissal:", error);
  }
}

export function shouldShowUpdateToast(): boolean {
  const storage = getLocalStorage();
  if (!storage) return true;

  try {
    const stored = storage.getItem(GLOBAL_LOCAL_STORAGE_KEYS.updateToastDismissed);
    if (!stored) return true;
    const lastDismissed = Number.parseInt(stored, 10);
    return Date.now() - lastDismissed > COOLDOWN_MS;
  } catch {
    return true;
  }
}
