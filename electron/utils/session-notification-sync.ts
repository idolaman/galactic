import {
  getFinishedSessionNotifications,
  type FinishedSessionNotification,
} from "./session-notifications.js";

export interface FinishedSessionNotificationSyncParams {
  nextSessions: unknown[];
  notificationsEnabled: boolean;
  notifiedSignatures: ReadonlySet<string>;
  preferredEditor?: string;
  previousSessions: unknown[];
  sessionCachePrimed: boolean;
}

export interface FinishedSessionNotificationSyncResult {
  nextCachedSessions: unknown[];
  nextSessionCachePrimed: boolean;
  notificationsToShow: FinishedSessionNotification[];
  signaturesToRecord: string[];
}

export const syncFinishedSessionNotificationState = ({
  nextSessions,
  notificationsEnabled,
  notifiedSignatures,
  preferredEditor,
  previousSessions,
  sessionCachePrimed,
}: FinishedSessionNotificationSyncParams): FinishedSessionNotificationSyncResult => {
  const allowNewDoneSessions = sessionCachePrimed;
  const notifications = getFinishedSessionNotifications({
    allowNewDoneSessions,
    nextSessions,
    preferredEditor,
    notifiedSignatures,
    previousSessions,
  });
  const signaturesToRecord = new Set<string>();

  if (!allowNewDoneSessions) {
    getFinishedSessionNotifications({
      allowNewDoneSessions: true,
      nextSessions,
      preferredEditor,
      notifiedSignatures,
      previousSessions,
    }).forEach(({ signature }) => {
      signaturesToRecord.add(signature);
    });
  }

  notifications.forEach(({ signature }) => {
    signaturesToRecord.add(signature);
  });

  return {
    nextCachedSessions: nextSessions,
    nextSessionCachePrimed: true,
    notificationsToShow: notificationsEnabled ? notifications : [],
    signaturesToRecord: Array.from(signaturesToRecord),
  };
};
