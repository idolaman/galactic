import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyUpdate,
  checkForUpdates,
  subscribeToUpdateEvents,
  setUpdateToastDismissed,
  shouldShowUpdateToast,
  type UpdateEventPayload,
} from "@/services/update";
import { useAppToast } from "@/hooks/use-app-toast";
import type { AppToastController } from "@/lib/app-toast";
import { ToastAction } from "@/components/ui/toast";

// Types
type BannerStatus =
  | "idle"
  | "checking"
  | "available"
  | "downloaded"
  | "not-available"
  | "error"
  | "unsupported";

interface UpdateState {
  status: BannerStatus;
  version?: string;
  message?: string;
}

// Module-level state (shared across all hook instances)
let globalState: UpdateState = { status: "idle" };
const listeners: Array<(state: UpdateState) => void> = [];
let isLaunchCheck = true;
let suppressToast = false;

function notifyListeners() {
  listeners.forEach((listener) => listener(globalState));
}

function setGlobalState(updater: (prev: UpdateState) => UpdateState) {
  globalState = updater(globalState);
  notifyListeners();
}

function subscribe(listener: (state: UpdateState) => void) {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
}

/**
 * Hook to subscribe to update events and show toasts.
 * Should be called ONCE at the App level.
 */
export function useUpdateListener() {
  const { info } = useAppToast();
  const toastRef = useRef<AppToastController | null>(null);

  const showUpdateToast = useCallback(
    (version?: string) => {
      toastRef.current?.dismiss();

      const versionLabel = version ? `v${version}` : "New version";
      toastRef.current = info({
        title: "Update ready to install",
        description: `${versionLabel} is ready. Restart to update.`,
        duration: Infinity,
        action: (
          <ToastAction altText="Install & Restart" onClick={() => void applyUpdate()}>
            Install & Restart
          </ToastAction>
        ),
        onOpenChange: (open) => {
          if (!open) {
            setUpdateToastDismissed();
          }
        },
      });
    },
    [info],
  );

  useEffect(() => {
    const unsubscribe = subscribeToUpdateEvents((payload: UpdateEventPayload) => {
      setGlobalState((prev) => ({
        ...prev,
        status: payload.status,
        version: payload.version ?? prev.version,
        message: payload.message ?? prev.message,
      }));

      if (payload.status === "downloaded") {
        // Skip toast if triggered by manual check from Settings
        if (suppressToast) {
          suppressToast = false;
          return;
        }
        // On launch: always show. After launch: respect 6-hour cooldown
        if (isLaunchCheck || shouldShowUpdateToast()) {
          showUpdateToast(payload.version);
        }
        isLaunchCheck = false;
      }
    });

    // Initial check on app launch
    if (isLaunchCheck) {
      void checkForUpdates();
    }

    return unsubscribe;
  }, [showUpdateToast]);
}

/**
 * Hook to get update state and trigger manual actions.
 * Can be called in any component (e.g., Settings).
 */
export function useUpdate() {
  const { error } = useAppToast();
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    return subscribe(() => forceUpdate((n) => n + 1));
  }, []);

  const handleCheck = useCallback(async () => {
    suppressToast = true;
    setGlobalState((prev) => ({ ...prev, status: "checking" }));

    const result = await checkForUpdates();

    if (!result.supported) {
      setGlobalState(() => ({ status: "unsupported", message: result.message }));
      return;
    }

    if (result.error) {
      setGlobalState(() => ({ status: "error", message: result.error }));
      error({
        title: "Update check failed",
        description: result.error,
      });
      return;
    }

    if (result.updateAvailable && result.version) {
      setGlobalState(() => ({ status: "available", version: result.version }));
      return;
    }

    setGlobalState((prev) => ({
      status: "idle",
      version: result.version ?? prev.version,
    }));
  }, [error]);

  const handleInstall = useCallback(async () => {
    const result = await applyUpdate();
    if (!result.success) {
      error({
        title: "Update failed",
        description: result.error ?? "Unable to install the update.",
      });
    }
  }, [error]);

  return {
    state: globalState,
    checkForUpdates: handleCheck,
    installUpdate: handleInstall,
  };
}
