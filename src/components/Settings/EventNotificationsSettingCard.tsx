import { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
    <Card className="border-border bg-card" id="event-notifications">
      <CardHeader className="pb-4">
        <CardTitle>Event Notifications</CardTitle>
        <CardDescription>Allow Galactic to alert you about important events.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Label htmlFor="event-notifications-enabled" className="text-sm font-medium">
            Galactic event alerts
          </Label>
          <p className="text-xs text-muted-foreground">{getStatusDetails(status)}</p>
          {isUnsupported && (
            <p className="text-xs text-muted-foreground">Development builds intentionally do not use the helper path.</p>
          )}
        </div>
        <Switch
          id="event-notifications-enabled"
          checked={status.enabled}
          disabled={loading || saving || (isUnsupported && !status.enabled)}
          onCheckedChange={handleCheckedChange}
        />
      </CardContent>
    </Card>
  );
}
