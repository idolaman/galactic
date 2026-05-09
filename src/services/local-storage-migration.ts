import {
  LOCAL_STORAGE_MIGRATION_CLAIM_KEY,
  type LocalStorageDataset,
  getLocalStorage,
  getLocalStorageMigrationClaimedBy,
  getScopedLocalStorageKey,
} from "./local-storage-scope.js";
import { USER_SCOPED_LOCAL_STORAGE_DATASETS } from "./local-storage-keys.js";

const DATASET_SEGMENTS: Record<LocalStorageDataset, string> =
  Object.fromEntries(
    USER_SCOPED_LOCAL_STORAGE_DATASETS.map((dataset) => [dataset, dataset]),
  ) as Record<LocalStorageDataset, string>;

export const getLegacyLocalStorageKey = (dataset: LocalStorageDataset): string =>
  `galactic-ide:${DATASET_SEGMENTS[dataset]}`;

const normalizeUserId = (userId: string): string | null => {
  const normalized = userId.trim();
  return normalized ? normalized : null;
};

const toMigratedJsonValue = (raw: string | null): string | null => {
  if (raw === null) return null;

  try {
    return Array.isArray(JSON.parse(raw)) ? raw : "[]";
  } catch {
    return "[]";
  }
};

const migrateDataset = (
  storage: Storage,
  userId: string,
  dataset: LocalStorageDataset,
): void => {
  const scopedKey = getScopedLocalStorageKey(userId, dataset);
  if (storage.getItem(scopedKey) !== null) return;

  const migratedValue = toMigratedJsonValue(
    storage.getItem(getLegacyLocalStorageKey(dataset)),
  );
  if (migratedValue !== null) {
    storage.setItem(scopedKey, migratedValue);
  }
};

export const claimLegacyLocalStorageMigration = (userId: string): void => {
  const storage = getLocalStorage();
  const normalized = normalizeUserId(userId);
  if (!storage || !normalized || getLocalStorageMigrationClaimedBy()) return;

  try {
    USER_SCOPED_LOCAL_STORAGE_DATASETS.forEach((dataset: LocalStorageDataset) =>
      migrateDataset(storage, normalized, dataset),
    );
    storage.setItem(LOCAL_STORAGE_MIGRATION_CLAIM_KEY, normalized);
  } catch (error) {
    console.warn("Failed to migrate legacy local storage:", error);
  }
};
