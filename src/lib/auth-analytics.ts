import type { AuthCallbackFailureReason } from "./auth-callback.js";
import type { AuthProviderName } from "../types/auth.js";

export interface AuthAnalyticsPayload extends Record<string, string | undefined> {
  provider?: AuthProviderName;
  reason?: AuthCallbackFailureReason;
}

export const buildAuthAnalyticsPayload = (
  provider?: AuthProviderName,
  reason?: AuthCallbackFailureReason,
): AuthAnalyticsPayload => ({
  ...(provider ? { provider } : {}),
  ...(reason ? { reason } : {}),
});
