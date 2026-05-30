import {
  readEncryptedAuthStorage,
  writeEncryptedAuthStorage,
} from "./auth-storage-crypto.js";

interface AuthStorageOptions {
  keyPath: string;
  storagePath: string;
}

export const createAuthStorage = ({ keyPath, storagePath }: AuthStorageOptions) => ({
  getItem: async (key: string): Promise<string | null> => {
    const values = await readEncryptedAuthStorage(storagePath, keyPath);
    return values[key] ?? null;
  },
  removeItem: async (key: string): Promise<void> => {
    const values = await readEncryptedAuthStorage(storagePath, keyPath);
    delete values[key];
    await writeEncryptedAuthStorage(storagePath, keyPath, values);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    const values = await readEncryptedAuthStorage(storagePath, keyPath);
    values[key] = value;
    await writeEncryptedAuthStorage(storagePath, keyPath, values);
  },
});
