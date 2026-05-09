import type { AuthProviderName } from "../types/auth.js";

export const AUTH_STATE_TTL_MS = 10 * 60 * 1000;

export type AuthCallbackFailureReason =
  | "callback_error"
  | "exchange_failed"
  | "invalid_state"
  | "missing_code"
  | "not_configured"
  | "open_browser_failed"
  | "session_restore_failed"
  | "sign_in_failed"
  | "sign_out_failed"
  | "unknown";

export interface PendingAuthState {
  createdAt: number;
  provider: AuthProviderName;
  state: string;
}

export interface ParsedAuthCallback {
  code: string | null;
  error: string | null;
  errorDescription: string | null;
}

export const createPendingAuthState = (
  provider: AuthProviderName,
  now = Date.now(),
  state = crypto.randomUUID(),
): PendingAuthState => ({
  createdAt: now,
  provider,
  state,
});

export const parseAuthCallbackUrl = (url: string): ParsedAuthCallback | null => {
  try {
    const parsed = new URL(url);
    return {
      code: parsed.searchParams.get("code"),
      error: parsed.searchParams.get("error"),
      errorDescription: parsed.searchParams.get("error_description"),
    };
  } catch {
    return null;
  }
};

export const validatePendingAuthState = (
  pendingState: PendingAuthState | null,
  now = Date.now(),
): AuthCallbackFailureReason | null => {
  if (!pendingState) {
    return "invalid_state";
  }

  if (now - pendingState.createdAt > AUTH_STATE_TTL_MS) {
    return "invalid_state";
  }

  return null;
};

export const buildAuthRedirectUrl = (callbackUrl: string): string => callbackUrl;
