import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { AuthContext } from "@/hooks/use-auth";
import {
  createAuthSessionTransition,
  emptyAuthSession,
  getAuthCallbackFailureStatus,
} from "@/lib/auth-session-transition";
import {
  finishOAuthCallback,
  signOutOfSupabase,
  startOAuthSignIn,
} from "@/services/auth-flow";
import { toAuthUser } from "@/services/auth-user";
import {
  activateAuthenticatedUserScope,
  clearAuthenticatedUserScope,
} from "@/services/auth-user-scope";
import { getSupabaseAuthConfig, getSupabaseClient } from "@/services/supabase";
import type { AuthProviderName, AuthSessionState, AuthStatus } from "@/types/auth";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthSessionState>(emptyAuthSession);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const authStateRef = useRef<AuthSessionState>(emptyAuthSession);

  const applySession = useCallback(async (session: AuthSessionState["session"]): Promise<boolean> => {
    const result = await createAuthSessionTransition(session, {
      activate: activateAuthenticatedUserScope,
      clear: clearAuthenticatedUserScope,
      toUser: toAuthUser,
    });

    if (!result.success) {
      if (result.authState) {
        authStateRef.current = result.authState;
        setAuthState(result.authState);
      }
      setError(result.error);
      if (result.status) setStatus(result.status);
      return false;
    }

    authStateRef.current = result.authState;
    setAuthState(result.authState);
    setStatus(result.status);
    return true;
  }, []);

  const handleCallbackUrl = useCallback(
    async (url: string | null | undefined) => {
      if (!url) return;
      if (!authStateRef.current.session?.user) setStatus("loading");
      const result = await finishOAuthCallback(url);
      if (result.success) {
        const applied = await applySession(result.session ?? null);
        if (applied) setError(null);
        return;
      }
      setError(result.error ?? "Authentication failed. Please try again.");
      setStatus(getAuthCallbackFailureStatus(authStateRef.current));
    },
    [applySession],
  );

  useEffect(() => {
    if (!getSupabaseAuthConfig().configured) {
      setStatus("unauthenticated");
      setError("Supabase auth is not configured.");
      return;
    }

    const client = getSupabaseClient();
    let cancelled = false;

    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) {
        void applySession(session);
      }
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, [applySession]);

  useEffect(() => {
    window.electronAPI?.consumeAuthCallbackUrl?.().then(handleCallbackUrl);
    const cleanup = window.electronAPI?.onAuthCallbackUrl?.((url) => {
      void handleCallbackUrl(url);
    });

    return () => cleanup?.();
  }, [handleCallbackUrl]);

  const signIn = useCallback(async (provider: AuthProviderName) => {
    setError(null);
    const result = await startOAuthSignIn(provider);
    if (!result.success) {
      setError(result.error ?? "Unable to start sign-in.");
      return false;
    }
    return true;
  }, []);

  const signOut = useCallback(async () => {
    const clearResult = await clearAuthenticatedUserScope();
    if (!clearResult.success) {
      setError(clearResult.error ?? "Unable to clear signed-in storage.");
      return;
    }

    const result = await signOutOfSupabase();
    await applySession(null);
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
