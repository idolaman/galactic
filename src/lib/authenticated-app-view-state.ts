import type { AuthStatus } from "@/types/auth";

export type AuthenticatedAppViewState =
  | "authenticated"
  | "main-sign-in"
  | "quick-sidebar-auth-loading"
  | "quick-sidebar-auth-required";

interface AuthenticatedAppViewStateInput {
  hasUser: boolean;
  isQuickSidebar: boolean;
  status: AuthStatus;
}

export const getAuthenticatedAppViewState = ({
  hasUser,
  isQuickSidebar,
  status,
}: AuthenticatedAppViewStateInput): AuthenticatedAppViewState => {
  if (status === "authenticated" && hasUser) {
    return "authenticated";
  }

  if (isQuickSidebar && status === "loading") {
    return "quick-sidebar-auth-loading";
  }

  return isQuickSidebar ? "quick-sidebar-auth-required" : "main-sign-in";
};
