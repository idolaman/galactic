import { useCallback, useEffect, useState } from "react";
import { applyUpdate, checkForUpdates, subscribeToUpdateEvents, type UpdateEventPayload } from "@/services/update";
import { useToast } from "@/hooks/use-toast";

type BannerStatus = "idle" | "checking" | "available" | "downloaded" | "not-available" | "error" | "unsupported";

interface UpdateState {
  status: BannerStatus;
  version?: string;
  message?: string;
}

export const useUpdate = () => {
  const [state, setState] = useState<UpdateState>({ status: "idle" });
  const { toast } = useToast();

  const applyPayload = useCallback((payload: UpdateEventPayload) => {
    setState((prev) => ({
      ...prev,
      status: payload.status,
      version: payload.version ?? prev.version,
      message: payload.message ?? prev.message,
    }));
  }, []);

  const handleCheck = useCallback(async () => {
    setState((prev) => ({ ...prev, status: "checking" }));
    const result = await checkForUpdates();
    if (!result.supported) {
      setState({ status: "unsupported", message: result.message });
      return;
    }
    if (result.error) {
      setState({ status: "error", message: result.error });
      toast({
        title: "Update check failed",
        description: result.error,
        variant: "destructive",
      });
      return;
    }
    if (result.updateAvailable && result.version) {
      setState({ status: "available", version: result.version });
      return;
    }
    setState({ status: "idle", version: result.version ?? state.version });
  }, [state.version, toast]);

  const installUpdate = useCallback(async () => {
    const result = await applyUpdate();
    if (!result.success) {
      toast({
        title: "Update failed",
        description: result.error ?? "Unable to install the update.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    const unsubscribe = subscribeToUpdateEvents(applyPayload);
    void handleCheck();
    return unsubscribe;
  }, [applyPayload, handleCheck]);

  return {
    state,
    checkForUpdates: handleCheck,
    installUpdate,
  };
};
