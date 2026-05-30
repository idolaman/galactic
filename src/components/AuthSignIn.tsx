import { useCallback, useEffect, useReducer, useRef } from "react";
import { Rocket } from "lucide-react";
import type { IconType } from "react-icons";
import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

import Logo from "@/assets/logo.svg";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import {
  AUTH_SIGN_IN_RETRY_TIMEOUT_MS,
  initialAuthSignInPendingState,
  reduceAuthSignInPendingState,
} from "@/lib/auth-sign-in-pending-state";
import { getAuthSignInViewState } from "@/lib/auth-sign-in-view-state";
import type { AuthProviderName } from "@/types/auth";

interface ProviderButton {
  icon: IconType;
  provider: AuthProviderName;
}

const providerButtons: ProviderButton[] = [
  { icon: FaGithub, provider: "github" },
  { icon: FcGoogle, provider: "google" },
];

export function AuthSignIn() {
  const { clearError, error, signIn } = useAuth();
  const [pendingState, dispatchPendingState] = useReducer(
    reduceAuthSignInPendingState,
    initialAuthSignInPendingState,
  );
  const signInInFlightRef = useRef(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewState = getAuthSignInViewState({
    isSignInPending: pendingState.isSignInPending,
  });

  const clearRetryTimer = useCallback(() => {
    if (!retryTimerRef.current) return;
    clearTimeout(retryTimerRef.current);
    retryTimerRef.current = null;
  }, []);

  const releasePendingSignIn = useCallback(() => {
    clearRetryTimer();
    signInInFlightRef.current = false;
    dispatchPendingState({ type: "released" });
  }, [clearRetryTimer]);

  useEffect(() => {
    return clearRetryTimer;
  }, [clearRetryTimer]);

  useEffect(() => {
    if (error && pendingState.isSignInPending) {
      releasePendingSignIn();
    }
  }, [error, pendingState.isSignInPending, releasePendingSignIn]);

  useEffect(() => {
    if (!pendingState.shouldScheduleRetry) return;

    clearRetryTimer();
    retryTimerRef.current = setTimeout(
      releasePendingSignIn,
      AUTH_SIGN_IN_RETRY_TIMEOUT_MS,
    );
  }, [
    clearRetryTimer,
    pendingState.shouldScheduleRetry,
    releasePendingSignIn,
  ]);

  const handleSignIn = async (provider: AuthProviderName) => {
    if (signInInFlightRef.current || pendingState.isSignInPending) return;

    signInInFlightRef.current = true;
    dispatchPendingState({ type: "start_requested" });
    clearError();
    try {
      const started = await signIn(provider);
      signInInFlightRef.current = false;
      dispatchPendingState({ started, type: "start_completed" });
    } catch {
      releasePendingSignIn();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <img src={Logo} alt="Galactic Logo" className="h-12 w-12 rounded-md" />
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-semibold text-foreground">Galactic</h1>
              <p className="text-sm text-muted-foreground">Sign in to continue</p>
            </div>
          </div>

          <div className="grid w-full gap-3">
            {error && <p className="text-center text-sm text-destructive">{error}</p>}
            {providerButtons.map(({ icon: Icon, provider }) => {
              const providerState = viewState.providers[provider];
              return (
                <Button
                  key={provider}
                  variant="outline"
                  size="lg"
                  disabled={providerState.disabled}
                  onClick={() => void handleSignIn(provider)}
                  className="h-12 w-full bg-background/80"
                >
                  <Icon className="mr-2 size-4" />
                  {providerState.label}
                </Button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
            <Rocket className="h-3.5 w-3.5" />
            <span>Early Access Preview</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
