import type { AuthSessionState, AuthStatus } from "../types/auth.js";

export const EMPTY_AUTH_SESSION: AuthSessionState = {
  session: null,
  user: null,
};

export const OAUTH_SIGN_IN_EXPIRED_ERROR = "Sign-in expired. Please start again.";

export interface AuthSessionTransition {
  authState: AuthSessionState;
  error: string | null;
  status: AuthStatus;
}

export const createUnauthenticatedTransition = (
  error: string | null = null,
): AuthSessionTransition => ({
  authState: EMPTY_AUTH_SESSION,
  error,
  status: "unauthenticated",
});

export const createOAuthAbandonedTransition = (): AuthSessionTransition =>
  createUnauthenticatedTransition(OAUTH_SIGN_IN_EXPIRED_ERROR);

export const createSignedOutTransition = (
  cleanupError: string | null | undefined,
): AuthSessionTransition => createUnauthenticatedTransition(cleanupError ?? null);
