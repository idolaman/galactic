import type { MacNotifierService } from "../mac-notifier/service.js";

interface MaybeAuthorizeEventNotificationsOnLaunchOptions {
  isPackaged: boolean;
  logWarning?: (message: string) => void;
  notificationsEnabled: boolean;
  notifier: Pick<MacNotifierService, "authorizeNotifications" | "getStatus">;
  platform: NodeJS.Platform;
}

export const maybeAuthorizeEventNotificationsOnLaunch = async ({
  isPackaged,
  logWarning,
  notificationsEnabled,
  notifier,
  platform,
}: MaybeAuthorizeEventNotificationsOnLaunchOptions): Promise<void> => {
  if (platform !== "darwin" || !isPackaged || !notificationsEnabled) {
    return;
  }

  const status = await notifier.getStatus();
  if (!status.supported || status.authorizationStatus !== "not-determined") {
    return;
  }

  const result = await notifier.authorizeNotifications();
  if (!result.success && result.authorizationStatus !== "denied") {
    logWarning?.(
      `Failed to authorize macOS notifications on launch: ${result.message ?? "Unknown error"}`,
    );
  }
};
