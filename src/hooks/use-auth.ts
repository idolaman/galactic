import { createContext, useContext } from "react";

import type { AuthProviderName, AuthSessionState, AuthStatus } from "@/types/auth";

export interface AuthContextValue extends AuthSessionState {
  clearError: () => void;
  error: string | null;
  signIn: (provider: AuthProviderName) => Promise<boolean>;
  signOut: () => Promise<void>;
  status: AuthStatus;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
};
