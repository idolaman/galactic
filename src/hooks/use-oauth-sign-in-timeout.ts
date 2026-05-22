import { useCallback, useEffect, useRef, type MutableRefObject } from "react";

import { AUTH_STATE_TTL_MS } from "@/lib/auth-callback";
import { cancelOAuthSignIn } from "@/services/auth-flow";

interface UseOAuthSignInTimeoutInput {
  oauthInFlightRef: MutableRefObject<boolean>;
  onTimeout: () => void;
}

interface OAuthSignInTimeoutControls {
  clearOAuthTimeout: () => void;
  startOAuthTimeout: () => void;
}

export const useOAuthSignInTimeout = ({
  oauthInFlightRef,
  onTimeout,
}: UseOAuthSignInTimeoutInput): OAuthSignInTimeoutControls => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearOAuthTimeout = useCallback(() => {
    if (timeoutRef.current === null) return;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const startOAuthTimeout = useCallback(() => {
    clearOAuthTimeout();
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      oauthInFlightRef.current = false;
      void cancelOAuthSignIn();
      onTimeout();
    }, AUTH_STATE_TTL_MS);
  }, [clearOAuthTimeout, oauthInFlightRef, onTimeout]);

  useEffect(() => clearOAuthTimeout, [clearOAuthTimeout]);

  return { clearOAuthTimeout, startOAuthTimeout };
};
