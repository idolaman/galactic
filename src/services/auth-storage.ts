const memoryStorage = new Map<string, string>();

const getElectronAPI = () =>
  typeof window === "undefined" ? undefined : window.electronAPI;

export const getAuthStorageItem = async (key: string): Promise<string | null> => {
  const api = getElectronAPI();
  if (!api?.getAuthStorageItem) {
    return memoryStorage.get(key) ?? null;
  }

  try {
    return await api.getAuthStorageItem(key);
  } catch (error) {
    console.warn("[Auth] Failed to read auth storage", error);
    throw error;
  }
};

export const setAuthStorageItem = async (
  key: string,
  value: string,
): Promise<void> => {
  const api = getElectronAPI();
  if (!api?.setAuthStorageItem) {
    memoryStorage.set(key, value);
    return;
  }

  try {
    await api.setAuthStorageItem(key, value);
  } catch (error) {
    console.warn("[Auth] Failed to write auth storage", error);
    throw error;
  }
};

export const removeAuthStorageItem = async (key: string): Promise<void> => {
  const api = getElectronAPI();
  if (!api?.removeAuthStorageItem) {
    memoryStorage.delete(key);
    return;
  }

  try {
    await api.removeAuthStorageItem(key);
    memoryStorage.delete(key);
  } catch (error) {
    console.warn("[Auth] Failed to remove auth storage", error);
    throw error;
  }
};

export const supabaseAuthStorage = {
  getItem: getAuthStorageItem,
  removeItem: removeAuthStorageItem,
  setItem: setAuthStorageItem,
};
