import { useEffect, useState } from "react";
import { Chrome, Github, Loader2, Rocket } from "lucide-react";

import Logo from "@/assets/logo.svg";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import type { AuthProviderName } from "@/types/auth";

interface ProviderButton {
  icon: typeof Github;
  label: string;
  provider: AuthProviderName;
}

const providerButtons: ProviderButton[] = [
  { icon: Github, label: "Continue with GitHub", provider: "github" },
  { icon: Chrome, label: "Continue with Google", provider: "google" },
];

const loadingText: Record<AuthProviderName, string> = {
  github: "Opening GitHub...",
  google: "Opening Google...",
};

export function AuthSignIn() {
  const { clearError, error, signIn, status } = useAuth();
  const [pendingProvider, setPendingProvider] = useState<AuthProviderName | null>(null);

  useEffect(() => {
    if (status !== "loading") {
      setPendingProvider(null);
    }
  }, [status]);

  const handleSignIn = async (provider: AuthProviderName) => {
    clearError();
    setPendingProvider(provider);
    await signIn(provider);
    setPendingProvider(null);
  };

  const isRestoring = status === "loading" && !pendingProvider;
  const disabled = Boolean(pendingProvider) || isRestoring;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-transparent p-4">
      <Card className="relative z-10 w-full max-w-md border-white/10 bg-card/60 p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col items-center gap-6 text-center">
          <img src={Logo} alt="Galactic Logo" className="h-20 w-20" />
          <div className="flex flex-col gap-2">
            <h1 className="bg-gradient-to-r from-white to-indigo-300 bg-clip-text text-4xl font-bold text-transparent">
              Galactic
            </h1>
            <p className="text-lg text-muted-foreground">
              {isRestoring ? "Restoring your session" : "Sign in to continue"}
            </p>
          </div>

          <div className="flex w-full flex-col gap-3">
            {providerButtons.map(({ icon: Icon, label, provider }) => {
              const isPending = pendingProvider === provider;
              return (
                <Button
                  key={provider}
                  variant="outline"
                  size="lg"
                  className="h-12 w-full gap-3"
                  disabled={disabled}
                  onClick={() => void handleSignIn(provider)}
                >
                  {isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                  {isPending ? loadingText[provider] : label}
                </Button>
              );
            })}
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
            <Rocket className="h-3.5 w-3.5" />
            <span>Early Access Preview</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
