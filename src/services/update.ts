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
const DISMISS_KEY = "galactic-ide:update-toast-dismissed";
const COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours

export function setUpdateToastDismissed(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DISMISS_KEY, Date.now().toString());
}

export function shouldShowUpdateToast(): boolean {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem(DISMISS_KEY);
  if (!stored) return true;
  const lastDismissed = parseInt(stored, 10);
  return Date.now() - lastDismissed > COOLDOWN_MS;
}
