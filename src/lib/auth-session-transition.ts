import type { Session } from "@supabase/supabase-js";

import type { AuthUserScopeResult } from "@/services/auth-user-scope";
import type { AuthSessionState, AuthStatus, AuthUser } from "@/types/auth";

export const emptyAuthSession: AuthSessionState = {
  session: null,
  user: null,
};

interface AuthSessionScopeActions {
  activate: (userId: string) => Promise<AuthUserScopeResult>;
  clear: () => Promise<AuthUserScopeResult>;
  toUser: (user: Session["user"]) => AuthUser;
}

interface AuthSessionTransitionSuccess {
  authState: AuthSessionState;
  error: null;
  status: AuthStatus;
  success: true;
}

interface AuthSessionTransitionFailure {
  authState?: AuthSessionState;
  error: string;
  status?: AuthStatus;
  success: false;
}

export type AuthSessionTransitionResult =
  | AuthSessionTransitionFailure
  | AuthSessionTransitionSuccess;

const getScopeError = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

const runScopeAction = async (
  action: () => Promise<AuthUserScopeResult>,
  fallback: string,
): Promise<AuthUserScopeResult> => {
  try {
    return await action();
  } catch (error) {
    return { success: false, error: getScopeError(error, fallback) };
  }
};

export const createAuthSessionTransition = async (
  session: Session | null,
  actions: AuthSessionScopeActions,
): Promise<AuthSessionTransitionResult> => {
  const userId = session?.user?.id;
  if (userId) {
    const scopeResult = await runScopeAction(
      () => actions.activate(userId),
      "Unable to activate signed-in storage.",
    );
    if (!scopeResult.success) {
      return {
        authState: emptyAuthSession,
        error: scopeResult.error ?? "Unable to activate signed-in storage.",
        status: "unauthenticated",
        success: false,
      };
    }
  } else {
    const clearResult = await runScopeAction(
      actions.clear,
      "Unable to clear signed-in storage.",
    );
    if (!clearResult.success) {
      return {
        error: clearResult.error ?? "Unable to clear signed-in storage.",
        success: false,
      };
    }
  }

  return {
    authState: {
      session,
      user: session?.user ? actions.toUser(session.user) : null,
    },
    error: null,
    status: session?.user ? "authenticated" : "unauthenticated",
    success: true,
  };
};

export const getAuthCallbackFailureStatus = (
  authState: AuthSessionState,
): AuthStatus => authState.session?.user ? "authenticated" : "unauthenticated";
