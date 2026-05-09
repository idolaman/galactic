import type { Session } from "@supabase/supabase-js";

export type AuthProviderName = "github" | "google";

export interface AuthUser {
  avatarUrl: string | null;
  email: string | null;
  id: string;
  name: string;
}

export type AuthStatus = "authenticated" | "loading" | "unauthenticated";

export interface AuthSessionState {
  session: Session | null;
  user: AuthUser | null;
}
