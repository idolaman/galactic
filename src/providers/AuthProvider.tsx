import type { ReactNode } from "react";

import { AuthContext } from "@/hooks/use-auth";
import { useAuthSessionController } from "@/hooks/use-auth-session-controller";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const value = useAuthSessionController();

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
