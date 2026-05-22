import type { AuthProviderName } from "../types/auth.js";

export interface AuthProviderButtonViewState {
  disabled: boolean;
  label: string;
}

export interface AuthSignInViewState {
  providers: Record<AuthProviderName, AuthProviderButtonViewState>;
}

const providerIdleLabels: Record<AuthProviderName, string> = {
  github: "Sign in with GitHub",
  google: "Sign in with Google",
};

interface AuthSignInViewStateInput {
  isSignInPending: boolean;
}

const buildProviderViewState = (
  provider: AuthProviderName,
  disabled: boolean,
): AuthProviderButtonViewState => {
  return {
    disabled,
    label: providerIdleLabels[provider],
  };
};

export const getAuthSignInViewState = ({
  isSignInPending,
}: AuthSignInViewStateInput): AuthSignInViewState => {
  return {
    providers: {
      github: buildProviderViewState("github", isSignInPending),
      google: buildProviderViewState("google", isSignInPending),
    },
  };
};
