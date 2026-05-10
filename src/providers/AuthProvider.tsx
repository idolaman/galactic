import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { AuthContext } from "@/hooks/use-auth";
import { finishOAuthCallback, signOutOfSupabase, startOAuthSignIn } from "@/services/auth-flow";
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

const emptySession: AuthSessionState = {
  session: null,
  user: null,
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthSessionState>(emptySession);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [error, setError] = useState<string | null>(null);

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
      setStatus("loading");
      const result = await finishOAuthCallback(url);
      if (result.success) {
        const applied = await applySession(result.session ?? null);
        if (applied) setError(null);
        return;
      }
      setError(result.error ?? "Authentication failed. Please try again.");
      setStatus("unauthenticated");
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
    }
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
