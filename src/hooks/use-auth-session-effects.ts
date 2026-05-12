import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from "react";

import { getSupabaseAuthConfig, getSupabaseClient } from "@/services/supabase";
import type { AuthSessionState, AuthStatus } from "@/types/auth";

interface AuthSessionEffectsInput {
  applySession: (session: AuthSessionState["session"]) => Promise<boolean>;
  handleCallbackUrl: (url: string | null | undefined) => Promise<void>;
  setError: Dispatch<SetStateAction<string | null>>;
  setStatus: Dispatch<SetStateAction<AuthStatus>>;
  signOutInFlightRef: MutableRefObject<boolean>;
}

export const useAuthSessionEffects = ({
  applySession,
  handleCallbackUrl,
  setError,
  setStatus,
  signOutInFlightRef,
}: AuthSessionEffectsInput): void => {
  useEffect(() => {
    if (!getSupabaseAuthConfig().configured) {
      setStatus("unauthenticated");
      setError("Supabase auth is not configured.");
      return;
    }

    const client = getSupabaseClient();
    let cancelled = false;

    const { data } = client.auth.onAuthStateChange((event, session) => {
      if (!cancelled && !(signOutInFlightRef.current && event === "SIGNED_OUT")) {
        void applySession(session);
      }
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, [applySession, setError, setStatus, signOutInFlightRef]);

  useEffect(() => {
    const consumeCallbackUrl = () => {
      void window.electronAPI?.consumeAuthCallbackUrl?.().then(handleCallbackUrl);
    };

    consumeCallbackUrl();
    const cleanup = window.electronAPI?.onAuthCallbackUrl?.(() => {
      consumeCallbackUrl();
    });

    return () => cleanup?.();
  }, [handleCallbackUrl]);
};
