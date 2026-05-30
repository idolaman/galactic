import { claimLegacyLocalStorageMigration } from "@/services/local-storage-migration";
import {
  clearActiveLocalStorageUserId,
  getActiveLocalStorageUserId,
  setActiveLocalStorageUserId,
} from "@/services/local-storage-scope";
import {
  clearWorkspaceIsolationActiveUser,
  setWorkspaceIsolationActiveUser,
} from "@/services/workspace-isolation-user-scope";

export interface AuthUserScopeResult {
  success: boolean;
  error?: string;
}

const normalizeUserId = (userId: string): string | null => {
  const normalized = userId.trim();
  return normalized ? normalized : null;
};

const clearLocalStorageScope = (): AuthUserScopeResult => {
  try {
    clearActiveLocalStorageUserId();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to clear local product storage.",
    };
  }

  if (getActiveLocalStorageUserId() !== null) {
    return { success: false, error: "Unable to clear local product storage." };
  }

  return { success: true };
};

export const activateAuthenticatedUserScope = async (
  userId: string,
): Promise<AuthUserScopeResult> => {
  const normalized = normalizeUserId(userId);
  if (!normalized) {
    return { success: false, error: "Authenticated storage scope requires a user id." };
  }

  try {
    claimLegacyLocalStorageMigration(normalized);
    setActiveLocalStorageUserId(normalized);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to activate local product storage.",
    };
  }
  if (getActiveLocalStorageUserId() !== normalized) {
    return { success: false, error: "Unable to activate local product storage." };
  }

  const electronScope = await setWorkspaceIsolationActiveUser(normalized);
  if (!electronScope.success) {
    const localScope = clearLocalStorageScope();
    await clearWorkspaceIsolationActiveUser();
    return {
      success: false,
      error:
        localScope.error ??
        electronScope.error ??
        "Unable to activate Project Services storage.",
    };
  }

  return { success: true };
};

export const clearAuthenticatedUserScope =
  async (): Promise<AuthUserScopeResult> => {
    const electronScope = await clearWorkspaceIsolationActiveUser();
    if (!electronScope.success) {
      return {
        success: false,
        error: electronScope.error ?? "Unable to clear Project Services storage.",
      };
    }

    return clearLocalStorageScope();
  };
