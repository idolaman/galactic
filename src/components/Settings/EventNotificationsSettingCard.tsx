import { useEffect, useState } from "react";

import { SettingRow } from "@/components/Settings/SettingRow";
import { SettingsSection } from "@/components/Settings/SettingsSection";
import { Switch } from "@/components/ui/switch";
import { useAppToast } from "@/hooks/use-app-toast";
import type { EventNotificationStatus } from "@/types/electron";

const defaultStatus: EventNotificationStatus = {
  authorizationStatus: "not-determined",
  enabled: false,
  supported: true,
};

const getStatusDetails = (status: EventNotificationStatus): string => {
  if (status.message) {
    return status.message;
  }

  if (!status.supported) {
    return "Event notifications are available only in packaged Galactic on macOS.";
  }

  if (status.authorizationStatus === "authorized") {
    return "Finished coding sessions will appear as macOS notifications. Use the notification button to open the workspace directly.";
  }

  if (status.authorizationStatus === "denied") {
    return "Galactic is blocked in macOS Settings. Turn the toggle off and on again after restoring notification permission.";
  }

  return "Turn this on to let Galactic request notification permission before sending finished-session alerts.";
};

export function EventNotificationsSettingCard() {
  const { error: showError } = useAppToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<EventNotificationStatus>(defaultStatus);

  useEffect(() => {
    let isMounted = true;

    const loadStatus = async () => {
      try {
        const nextStatus = await window.electronAPI?.getEventNotificationStatus?.();
        if (isMounted && nextStatus) {
          setStatus(nextStatus);
        }
      } catch (_caughtError) {
        if (isMounted) {
          showError({
            title: "Notification setting unavailable",
            description: "Unable to load the event notification preference.",
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadStatus();
    return () => {
      isMounted = false;
    };
  }, [showError]);

  const handleCheckedChange = async (nextValue: boolean) => {
    setSaving(true);
    try {
      const result = await window.electronAPI?.setEventNotificationsEnabled?.(nextValue);
      if (!result?.success) {
        showError({
          title: "Notification update failed",
          description: result?.error ?? "Unable to update the event notification preference.",
        });
      }
      const nextStatus = await window.electronAPI?.getEventNotificationStatus?.();
      if (nextStatus) {
        setStatus(nextStatus);
      }
    } catch (_caughtError) {
      showError({
        title: "Notification update failed",
        description: "Unable to update the event notification preference.",
      });
    } finally {
      setSaving(false);
    }
  };

  const isUnsupported = !status.supported;

  return (
    <SettingsSection
      id="event-notifications"
      title="Event Notifications"
      description="Allow Galactic to alert you about important events."
    >
      <SettingRow
        label="Galactic event alerts"
        htmlFor="event-notifications-enabled"
        description={(
          <>
            <p>{getStatusDetails(status)}</p>
            {isUnsupported && <p>Development builds intentionally do not use the helper path.</p>}
          </>
        )}
      >
        <Switch
          id="event-notifications-enabled"
          checked={status.enabled}
          disabled={loading || saving || (isUnsupported && !status.enabled)}
          onCheckedChange={handleCheckedChange}
        />
      </SettingRow>
    </SettingsSection>
  );
}
