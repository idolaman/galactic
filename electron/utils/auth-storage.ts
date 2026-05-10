import { existsSync } from "node:fs";
import { promises as fsPromises } from "node:fs";
import path from "node:path";

interface SafeStorageLike {
  decryptString: (encryptedBuffer: Buffer) => string;
  encryptString: (plainText: string) => Buffer;
  isEncryptionAvailable: () => boolean;
}

interface AuthStorageOptions {
  safeStorage: SafeStorageLike;
  storagePath: string;
}

const memoryStorage = new Map<string, string>();

const isRecord = (value: unknown): value is Record<string, string> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every((entry) => typeof entry === "string");
};

const readEncryptedStorage = async (
  storagePath: string,
  safeStorage: SafeStorageLike,
): Promise<Record<string, string>> => {
  if (!safeStorage.isEncryptionAvailable() || !existsSync(storagePath)) {
    return {};
  }

  try {
    const encrypted = Buffer.from(await fsPromises.readFile(storagePath, "utf-8"), "base64");
    const parsed = JSON.parse(safeStorage.decryptString(encrypted)) as unknown;
    return isRecord(parsed) ? parsed : {};
  } catch (error) {
    console.warn("[AuthStorage] Failed to read encrypted auth storage:", error);
    return {};
  }
};

const writeEncryptedStorage = async (
  storagePath: string,
  safeStorage: SafeStorageLike,
  values: Record<string, string>,
): Promise<void> => {
  await fsPromises.mkdir(path.dirname(storagePath), { recursive: true });
  const encrypted = safeStorage.encryptString(JSON.stringify(values));
  await fsPromises.writeFile(storagePath, encrypted.toString("base64"), "utf-8");
};

export const createAuthStorage = ({ safeStorage, storagePath }: AuthStorageOptions) => {
  const getBackingStore = async (): Promise<Record<string, string>> => {
    if (!safeStorage.isEncryptionAvailable()) {
      return Object.fromEntries(memoryStorage.entries());
    }
    return await readEncryptedStorage(storagePath, safeStorage);
  };

  const persistBackingStore = async (values: Record<string, string>) => {
    memoryStorage.clear();
    Object.entries(values).forEach(([key, value]) => memoryStorage.set(key, value));
    if (safeStorage.isEncryptionAvailable()) {
      await writeEncryptedStorage(storagePath, safeStorage, values);
    }
  };

  return {
    getItem: async (key: string): Promise<string | null> => {
      const values = await getBackingStore();
      return values[key] ?? null;
    },
    removeItem: async (key: string): Promise<void> => {
      const values = await getBackingStore();
      delete values[key];
      await persistBackingStore(values);
    },
    setItem: async (key: string, value: string): Promise<void> => {
      const values = await getBackingStore();
      values[key] = value;
      await persistBackingStore(values);
    },
  };
};
