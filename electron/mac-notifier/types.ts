import type { SupportedEditorName } from "../editor-launch/types.js";

export type MacNotifierAuthorizationStatus =
  | "authorized"
  | "denied"
  | "not-determined"
  | "unsupported";

export interface MacNotifierLaunchTarget {
  appName: string;
  editor: SupportedEditorName;
  workspacePath: string;
}

export interface MacNotifierPayload {
  actionText?: string;
  body: string;
  launchTargets: MacNotifierLaunchTarget[];
  signature: string;
  subtitle?: string;
  title: string;
}

export interface MacNotifierStatus {
  authorizationStatus: MacNotifierAuthorizationStatus;
  message?: string;
  supported: boolean;
}

export interface AuthorizeMacNotificationResult extends MacNotifierStatus {
  success: boolean;
}

export interface ShowMacNotificationResult {
  error?: string;
  supported?: boolean;
  success: boolean;
}
