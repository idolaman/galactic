import { USER_SCOPED_LOCAL_STORAGE_DATASETS } from "./local-storage-keys.js";

export type LocalStorageDataset = (typeof USER_SCOPED_LOCAL_STORAGE_DATASETS)[number];

export const ACTIVE_USER_ID_STORAGE_KEY = "galactic-ide:active-user-id";
export const LOCAL_STORAGE_MIGRATION_CLAIM_KEY =
  "galactic-ide:local-storage-migration:v1:claimed-by";
export const LOCAL_STORAGE_SCOPE_UPDATED_EVENT =
  "galactic-local-storage-scope-updated";
export const PRODUCT_STORAGE_AUTH_REQUIRED_ERROR =
  "Product storage requires an active signed-in user.";
export const PRODUCT_STORAGE_UNAVAILABLE_ERROR =
  "Product storage is unavailable.";

const DATASET_SEGMENTS: Record<LocalStorageDataset, string> =
  Object.fromEntries(
    USER_SCOPED_LOCAL_STORAGE_DATASETS.map((dataset) => [dataset, dataset]),
  ) as Record<LocalStorageDataset, string>;

export const getLocalStorage = (): Storage | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
};

const normalizeUserId = (userId: string | null): string | null => {
  const normalized = userId?.trim();
  return normalized ? normalized : null;
};

const readStorageValue = (storage: Storage, key: string): string | null => {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
};

const dispatchScopeUpdated = (): void => {
  if (typeof window === "undefined" || typeof window.dispatchEvent !== "function") {
    return;
  }

  try {
    window.dispatchEvent(new Event(LOCAL_STORAGE_SCOPE_UPDATED_EVENT));
  } catch {
    // Scope changes are still valid if event dispatch is unavailable.
  }
};

export const getScopedLocalStorageKey = (
  userId: string,
  dataset: LocalStorageDataset,
): string => `galactic-ide:${userId}:${DATASET_SEGMENTS[dataset]}`;

export const getActiveLocalStorageUserId = (): string | null => {
  const storage = getLocalStorage();
  if (!storage) return null;
  return normalizeUserId(readStorageValue(storage, ACTIVE_USER_ID_STORAGE_KEY));
};

export const getLocalStorageMigrationClaimedBy = (): string | null => {
  const storage = getLocalStorage();
  if (!storage) return null;
  return normalizeUserId(readStorageValue(storage, LOCAL_STORAGE_MIGRATION_CLAIM_KEY));
};

export const setActiveLocalStorageUserId = (userId: string): void => {
  const storage = getLocalStorage();
  const normalized = normalizeUserId(userId);
  if (!storage) throw new Error(PRODUCT_STORAGE_UNAVAILABLE_ERROR);
  if (!normalized) throw new Error(PRODUCT_STORAGE_AUTH_REQUIRED_ERROR);
  if (getActiveLocalStorageUserId() === normalized) return;

  try {
    storage.setItem(ACTIVE_USER_ID_STORAGE_KEY, normalized);
    dispatchScopeUpdated();
  } catch (error) {
    console.warn("Failed to set active local storage user:", error);
    throw new Error("Unable to set active local storage user.");
  }

  if (getActiveLocalStorageUserId() !== normalized) {
    throw new Error("Unable to set active local storage user.");
  }
};

export const clearActiveLocalStorageUserId = (): void => {
  const storage = getLocalStorage();
  if (!storage || getActiveLocalStorageUserId() === null) return;

  try {
    storage.removeItem(ACTIVE_USER_ID_STORAGE_KEY);
    dispatchScopeUpdated();
  } catch (error) {
    console.warn("Failed to clear active local storage user:", error);
    throw new Error("Unable to clear active local storage user.");
  }

  if (getActiveLocalStorageUserId() !== null) {
    throw new Error("Unable to clear active local storage user.");
  }
};

export const getProductStorageKey = (
  dataset: LocalStorageDataset,
): string => {
  const storage = getLocalStorage();
  if (!storage) throw new Error(PRODUCT_STORAGE_UNAVAILABLE_ERROR);

  const activeUserId = normalizeUserId(readStorageValue(storage, ACTIVE_USER_ID_STORAGE_KEY));
  if (!activeUserId) throw new Error(PRODUCT_STORAGE_AUTH_REQUIRED_ERROR);

  return getScopedLocalStorageKey(activeUserId, dataset);
};

export const isActiveLocalStorageDatasetKey = (
  key: string | null,
  dataset: LocalStorageDataset,
): boolean => {
  if (!key) return false;
  const activeUserId = getActiveLocalStorageUserId();
  return activeUserId ? key === getScopedLocalStorageKey(activeUserId, dataset) : false;
};

export const isLocalStorageScopeKey = (key: string | null): boolean =>
  key === ACTIVE_USER_ID_STORAGE_KEY || key === LOCAL_STORAGE_MIGRATION_CLAIM_KEY;
