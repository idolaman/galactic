import type { PendingAuthState } from "@/lib/auth-callback";
import { getAuthStorageItem, removeAuthStorageItem, setAuthStorageItem } from "@/services/auth-storage";

const PENDING_AUTH_STATE_KEY = "galactic-ide:auth:pending-state";

const isPendingAuthState = (value: unknown): value is PendingAuthState => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.createdAt === "number" &&
    (candidate.provider === "github" || candidate.provider === "google") &&
    typeof candidate.state === "string"
  );
};

export const loadPendingAuthState = async (): Promise<PendingAuthState | null> => {
  const raw = await getAuthStorageItem(PENDING_AUTH_STATE_KEY);
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
  await setAuthStorageItem(PENDING_AUTH_STATE_KEY, JSON.stringify(state));
};

export const clearPendingAuthState = async (): Promise<void> => {
  await removeAuthStorageItem(PENDING_AUTH_STATE_KEY);
};
