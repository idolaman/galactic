import type { Session } from "@supabase/supabase-js";

import { buildAuthRedirectUrl, createPendingAuthState, parseAuthCallbackUrl, validatePendingAuthState, type AuthCallbackFailureReason } from "@/lib/auth-callback";
import type { AuthProviderName } from "@/types/auth";
import { clearPendingAuthState, loadPendingAuthState, savePendingAuthState } from "@/services/auth-state";
import { getSupabaseClient } from "@/services/supabase";
import { trackAuthCompleted, trackAuthFailed, trackAuthSignedOut, trackAuthStarted } from "@/services/analytics";

export interface AuthFlowResult {
  error?: string;
  reason?: AuthCallbackFailureReason;
  session?: Session | null;
  success: boolean;
}

const getElectronAPI = () =>
  typeof window === "undefined" ? undefined : window.electronAPI;

const toAuthFlowError = (
  reason: AuthCallbackFailureReason,
  error = "Authentication failed. Please try again.",
): AuthFlowResult => ({ error, reason, success: false });

export const startOAuthSignIn = async (
  provider: AuthProviderName,
): Promise<AuthFlowResult> => {
  trackAuthStarted(provider);

  try {
    const client = getSupabaseClient();
    const callbackUrl = await getElectronAPI()?.getAuthCallbackUrl?.();
    if (!callbackUrl) {
      trackAuthFailed(provider, "not_configured");
      return toAuthFlowError("not_configured", "Desktop auth callback is not available.");
    }

    const pendingState = createPendingAuthState(provider);
    await savePendingAuthState(pendingState);

    const { data, error } = await client.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: buildAuthRedirectUrl(callbackUrl),
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) {
      await clearPendingAuthState();
      trackAuthFailed(provider, "sign_in_failed");
      return toAuthFlowError("sign_in_failed");
    }

    const openResult = await getElectronAPI()?.openExternalAuthUrl?.(data.url);
    if (!openResult?.success) {
      await clearPendingAuthState();
      trackAuthFailed(provider, "open_browser_failed");
      return toAuthFlowError("open_browser_failed", "Unable to open your browser.");
    }

    return { success: true };
  } catch {
    await clearPendingAuthState();
    trackAuthFailed(provider, "unknown");
    return toAuthFlowError("unknown");
  }
};

export const finishOAuthCallback = async (url: string): Promise<AuthFlowResult> => {
  const callback = parseAuthCallbackUrl(url);
  let pendingState: Awaited<ReturnType<typeof loadPendingAuthState>>;
  try {
    pendingState = await loadPendingAuthState();
  } catch {
    trackAuthFailed(undefined, "unknown");
    return toAuthFlowError("unknown", "Unable to read sign-in state. Please try again.");
  }
  const provider = pendingState?.provider;

  if (!callback) {
    trackAuthFailed(provider, "callback_error");
    return toAuthFlowError("callback_error");
  }

  const stateError = validatePendingAuthState(pendingState, Date.now());
  if (stateError) {
    await clearPendingAuthState();
    trackAuthFailed(provider, stateError);
    return toAuthFlowError(stateError, "Sign-in expired. Please start again.");
  }

  if (callback.error) {
    await clearPendingAuthState();
    trackAuthFailed(provider, "callback_error");
    return toAuthFlowError("callback_error", callback.errorDescription ?? undefined);
  }

  if (!callback.code) {
    await clearPendingAuthState();
    trackAuthFailed(provider, "missing_code");
    return toAuthFlowError("missing_code");
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client.auth.exchangeCodeForSession(callback.code);
    await clearPendingAuthState();

    if (!error && data.session) {
      trackAuthCompleted(provider);
      return { session: data.session, success: true };
    }
  } catch {
    // Fall through to the shared exchange failure path.
  }

  await clearPendingAuthState();
  trackAuthFailed(provider, "exchange_failed");
  return toAuthFlowError("exchange_failed");
};

export const signOutOfSupabase = async (): Promise<AuthFlowResult> => {
  try {
    const { error } = await getSupabaseClient().auth.signOut({ scope: "local" });
    await clearPendingAuthState();
    if (error) {
      trackAuthFailed(undefined, "sign_out_failed");
      return toAuthFlowError("sign_out_failed");
    }
    trackAuthSignedOut();
    return { success: true };
  } catch {
    trackAuthFailed(undefined, "sign_out_failed");
    return toAuthFlowError("sign_out_failed");
  }
};
