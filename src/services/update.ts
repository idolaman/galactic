type UpdateStatus = "available" | "downloaded" | "not-available" | "error";

export interface UpdateEventPayload {
  status: UpdateStatus;
  version?: string;
  message?: string;
  releaseDate?: string;
}

const isUpdateStatus = (value: string): value is UpdateStatus =>
  value === "available" ||
  value === "downloaded" ||
  value === "not-available" ||
  value === "error";

export const checkForUpdates = async (): Promise<{
  supported: boolean;
  updateAvailable?: boolean;
  version?: string | null;
  message?: string;
  error?: string;
}> => {
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
};

export const applyUpdate = async (): Promise<{ success: boolean; error?: string }> => {
  if (typeof window === "undefined") {
    return { success: false, error: "Updates require the desktop app." };
  }

  try {
    const result = await window.electronAPI?.applyUpdate?.();
    return result ?? { success: false, error: "Update bridge unavailable." };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to install update." };
  }
};

export const subscribeToUpdateEvents = (
  handler: (payload: UpdateEventPayload) => void,
): (() => void) => {
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
};
