import type { PendingAuthState } from "@/lib/auth-callback";
import { getAuthStorageItem, removeAuthStorageItem, setAuthStorageItem } from "@/services/auth-storage";
import { AUTH_STORAGE_KEYS } from "@/services/local-storage-keys";

const isPendingAuthState = (value: unknown): value is PendingAuthState => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.createdAt === "number" &&
    Number.isFinite(candidate.createdAt) &&
    candidate.createdAt > 0 &&
    (candidate.provider === "github" || candidate.provider === "google") &&
    typeof candidate.state === "string"
  );
};

export const loadPendingAuthState = async (): Promise<PendingAuthState | null> => {
  const raw = await getAuthStorageItem(AUTH_STORAGE_KEYS.pendingState);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isPendingAuthState(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const savePendingAuthState = async (
  state: PendingAuthState,
): Promise<void> => {
  await setAuthStorageItem(AUTH_STORAGE_KEYS.pendingState, JSON.stringify(state));
};

export const clearPendingAuthState = async (): Promise<void> => {
  await removeAuthStorageItem(AUTH_STORAGE_KEYS.pendingState);
};
