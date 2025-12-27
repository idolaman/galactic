import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyUpdate,
  checkForUpdates,
  subscribeToUpdateEvents,
  setUpdateToastDismissed,
  shouldShowUpdateToast,
  type UpdateEventPayload,
} from "@/services/update";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
  const toastRef = useRef<{ id: string; dismiss: () => void } | null>(null);

  const showUpdateToast = useCallback(
    (version?: string) => {
      toastRef.current?.dismiss();

      const versionLabel = version ? `v${version}` : "New version";
      toastRef.current = toast({
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
    [toast],
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
  const { toast } = useToast();
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
      toast({
        title: "Update check failed",
        description: result.error,
        variant: "destructive",
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
  }, [toast]);

  const handleInstall = useCallback(async () => {
    const result = await applyUpdate();
    if (!result.success) {
      toast({
        title: "Update failed",
        description: result.error ?? "Unable to install the update.",
        variant: "destructive",
      });
    }
  }, [toast]);

  return {
    state: globalState,
    checkForUpdates: handleCheck,
    installUpdate: handleInstall,
  };
}
