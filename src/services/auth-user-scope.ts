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

interface AuthUserScopeResult {
  success: boolean;
  error?: string;
}

const normalizeUserId = (userId: string): string | null => {
  const normalized = userId.trim();
  return normalized ? normalized : null;
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
    clearActiveLocalStorageUserId();
    await clearWorkspaceIsolationActiveUser();
    return {
      success: false,
      error: electronScope.error ?? "Unable to activate Project Services storage.",
    };
  }

  return { success: true };
};

export const clearAuthenticatedUserScope =
  async (): Promise<AuthUserScopeResult> => {
    clearActiveLocalStorageUserId();
    const electronScope = await clearWorkspaceIsolationActiveUser();
    return electronScope.success
      ? { success: true }
      : {
          success: false,
          error: electronScope.error ?? "Unable to clear Project Services storage.",
        };
  };
