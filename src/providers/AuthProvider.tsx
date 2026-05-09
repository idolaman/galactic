import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { AuthContext } from "@/hooks/use-auth";
import { finishOAuthCallback, signOutOfSupabase, startOAuthSignIn } from "@/services/auth-flow";
import { toAuthUser } from "@/services/auth-user";
import { getSupabaseAuthConfig, getSupabaseClient } from "@/services/supabase";
import type { AuthProviderName, AuthSessionState, AuthStatus } from "@/types/auth";

interface AuthProviderProps {
  children: ReactNode;
  enabled?: boolean;
}

const emptySession: AuthSessionState = {
  session: null,
  user: null,
};

export function AuthProvider({ children, enabled = true }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthSessionState>(emptySession);
  const [status, setStatus] = useState<AuthStatus>(enabled ? "loading" : "unauthenticated");
  const [error, setError] = useState<string | null>(null);

  const applySession = useCallback((session: AuthSessionState["session"]) => {
    setAuthState({
      session,
      user: session?.user ? toAuthUser(session.user) : null,
    });
    setStatus(session?.user ? "authenticated" : "unauthenticated");
  }, []);

  const handleCallbackUrl = useCallback(
    async (url: string | null | undefined) => {
      if (!url) return;
      setStatus("loading");
      const result = await finishOAuthCallback(url);
      if (result.success) {
        applySession(result.session ?? null);
        setError(null);
        return;
      }
      setError(result.error ?? "Authentication failed. Please try again.");
      setStatus("unauthenticated");
    },
    [applySession],
  );

  useEffect(() => {
    if (!enabled) return;
    if (!getSupabaseAuthConfig().configured) {
      setStatus("unauthenticated");
      setError("Supabase auth is not configured.");
      return;
    }

    const client = getSupabaseClient();
    let cancelled = false;

    client.auth.getSession()
      .then(({ data }) => {
        if (!cancelled) applySession(data.session);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Unable to restore your session.");
          setStatus("unauthenticated");
        }
      });

    const { data } = client.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, [applySession, enabled]);

  useEffect(() => {
    if (!enabled) return;

    window.electronAPI?.consumeAuthCallbackUrl?.().then(handleCallbackUrl);
    const cleanup = window.electronAPI?.onAuthCallbackUrl?.((url) => {
      void handleCallbackUrl(url);
    });

    return () => cleanup?.();
  }, [enabled, handleCallbackUrl]);

  const signIn = useCallback(async (provider: AuthProviderName) => {
    setError(null);
    const result = await startOAuthSignIn(provider);
    if (!result.success) {
      setError(result.error ?? "Unable to start sign-in.");
    }
  }, []);

  const signOut = useCallback(async () => {
    const result = await signOutOfSupabase();
    applySession(null);
    if (!result.success) {
      setError(result.error ?? "Unable to sign out.");
    }
  }, [applySession]);

  const value = useMemo(
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
