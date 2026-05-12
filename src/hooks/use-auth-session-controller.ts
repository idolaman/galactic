import { useCallback, useMemo, useRef, useState } from "react";

import type { AuthContextValue } from "@/hooks/use-auth";
import { useAuthSessionEffects } from "@/hooks/use-auth-session-effects";
import { finishOAuthCallback, signOutOfSupabase, startOAuthSignIn } from "@/services/auth-flow";
import { toAuthUser } from "@/services/auth-user";
import {
  activateAuthenticatedUserScope,
  clearAuthenticatedUserScope,
} from "@/services/auth-user-scope";
import type { AuthProviderName, AuthSessionState, AuthStatus } from "@/types/auth";

const emptySession: AuthSessionState = {
  session: null,
  user: null,
};

export const useAuthSessionController = (): AuthContextValue => {
  const [authState, setAuthState] = useState<AuthSessionState>(emptySession);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const oauthInFlightRef = useRef(false);
  const signOutInFlightRef = useRef(false);

  const applySession = useCallback(async (session: AuthSessionState["session"]): Promise<boolean> => {
    const userId = session?.user?.id;
    if (userId) {
      const scopeResult = await activateAuthenticatedUserScope(userId);
      if (!scopeResult.success) {
        setAuthState(emptySession);
        setError(scopeResult.error ?? "Unable to activate signed-in storage.");
        setStatus("unauthenticated");
        return false;
      }
    } else {
      await clearAuthenticatedUserScope();
    }

    setAuthState({
      session,
      user: session?.user ? toAuthUser(session.user) : null,
    });
    setStatus(session?.user ? "authenticated" : "unauthenticated");
    return true;
  }, []);

  const handleCallbackUrl = useCallback(
    async (url: string | null | undefined) => {
      if (!url) return;
      oauthInFlightRef.current = true;
      setStatus("loading");
      try {
        const result = await finishOAuthCallback(url);
        oauthInFlightRef.current = false;
        if (result.success) {
          const applied = await applySession(result.session ?? null);
          if (applied) setError(null);
          return;
        }
        setError(result.error ?? "Authentication failed. Please try again.");
      } catch {
        oauthInFlightRef.current = false;
        setError("Authentication failed. Please try again.");
      }
      setStatus("unauthenticated");
    },
    [applySession],
  );

  useAuthSessionEffects({
    applySession,
    handleCallbackUrl,
    setError,
    setStatus,
    signOutInFlightRef,
  });

  const signIn = useCallback(async (provider: AuthProviderName) => {
    if (oauthInFlightRef.current || status === "loading") return;
    oauthInFlightRef.current = true;
    setStatus("loading");
    setError(null);
    try {
      const result = await startOAuthSignIn(provider);
      if (result.success) return;
      setError(result.error ?? "Unable to start sign-in.");
    } catch {
      setError("Unable to start sign-in.");
    }
    oauthInFlightRef.current = false;
    setStatus("unauthenticated");
  }, [status]);

  const signOut = useCallback(async () => {
    if (signOutInFlightRef.current) return;
    signOutInFlightRef.current = true;
    setError(null);
    try {
      const result = await signOutOfSupabase();
      if (!result.success) {
        setError(result.error ?? "Unable to sign out.");
        return;
      }

      const clearResult = await clearAuthenticatedUserScope();
      if (!clearResult.success) {
        setError(clearResult.error ?? "Unable to clear signed-in storage.");
        return;
      }

      setAuthState(emptySession);
      setStatus("unauthenticated");
    } finally {
      signOutInFlightRef.current = false;
    }
  }, []);

  return useMemo(
    () => ({
      ...authState,
      clearError: () => setError(null),
      error,
      signIn,
      signOut,
      status,
    }),
    [authState, error, signIn, signOut, status],
  );
};
