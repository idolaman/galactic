import type { AuthProviderName, AuthStatus } from "../types/auth.js";

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
  status: AuthStatus;
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
  status,
}: AuthSignInViewStateInput): AuthSignInViewState => {
  const isLoading = status === "loading";

  return {
    providers: {
      github: buildProviderViewState("github", isLoading),
      google: buildProviderViewState("google", isLoading),
    },
  };
};
