import { useRef } from "react";
import { Rocket } from "lucide-react";
import type { IconType } from "react-icons";
import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

import Logo from "@/assets/logo.svg";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
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
  const { clearError, error, signIn, status } = useAuth();
  const signInInFlightRef = useRef(false);
  const viewState = getAuthSignInViewState({ status });

  const handleSignIn = async (provider: AuthProviderName) => {
    if (signInInFlightRef.current) return;

    signInInFlightRef.current = true;
    clearError();
    try {
      await signIn(provider);
    } finally {
      signInInFlightRef.current = false;
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-transparent p-4">
      <Card className="relative z-10 w-full max-w-sm border-white/10 bg-card/70 p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <img src={Logo} alt="Galactic Logo" className="h-16 w-16" />
            <div className="flex flex-col gap-2">
              <h1 className="bg-gradient-to-r from-white to-indigo-300 bg-clip-text text-4xl font-bold text-transparent">
                Galactic
              </h1>
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
