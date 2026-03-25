export interface ToastDefaultsInput {
  duration?: number;
  variant?: "default" | "destructive";
}

export const DEFAULT_ERROR_TOAST_DURATION = 5000;

export const applyToastDefaults = <T extends ToastDefaultsInput>(toast: T): T => {
  if (toast.variant !== "destructive" || toast.duration !== undefined) {
    return toast;
  }

  return {
    ...toast,
    duration: DEFAULT_ERROR_TOAST_DURATION,
  };
};
