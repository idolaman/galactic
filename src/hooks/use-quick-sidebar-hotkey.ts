import { useEffect, useState } from "react";
import type { ToastActionElement } from "@/components/ui/toast";

interface ToastPayload {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  action?: ToastActionElement;
}

interface QuickSidebarHotkeyState {
  enabled: boolean;
  loading: boolean;
  saving: boolean;
  setEnabled: (enabled: boolean) => Promise<void>;
}

export const useQuickSidebarHotkey = (
  toast: (payload: ToastPayload) => void,
): QuickSidebarHotkeyState => {
  const [enabled, setEnabledState] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const value = await window.electronAPI?.getQuickSidebarHotkeyEnabled?.();
        if (active) {
          setEnabledState(Boolean(value));
        }
      } catch {
        if (active) {
          toast({
            title: "Hotkey setting unavailable",
            description: "Unable to load the global hotkey preference.",
            variant: "destructive",
          });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [toast]);

  const setEnabled = async (nextValue: boolean) => {
    const previous = enabled;
    setEnabledState(nextValue);
    setSaving(true);
    try {
      const result = await window.electronAPI?.setQuickSidebarHotkeyEnabled?.(nextValue);
      if (!result?.success) {
        setEnabledState(result?.enabled ?? previous);
        toast({ title: "Hotkey update failed", description: result?.error, variant: "destructive" });
        return;
      }
      setEnabledState(result.enabled);
    } catch {
      setEnabledState(previous);
      toast({ title: "Hotkey update failed", description: "Unable to update the global hotkey.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return { enabled, loading, saving, setEnabled };
};
