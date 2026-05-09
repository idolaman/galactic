const memoryStorage = new Map<string, string>();

const getElectronAPI = () =>
  typeof window === "undefined" ? undefined : window.electronAPI;

export const getAuthStorageItem = async (key: string): Promise<string | null> => {
  try {
    const api = getElectronAPI();
    if (!api?.getAuthStorageItem) {
      return memoryStorage.get(key) ?? null;
    }
    return await api.getAuthStorageItem(key);
  } catch (error) {
    console.warn("[Auth] Failed to read auth storage", error);
    return null;
  }
};

export const setAuthStorageItem = async (
  key: string,
  value: string,
): Promise<void> => {
  try {
    const api = getElectronAPI();
    if (!api?.setAuthStorageItem) {
      memoryStorage.set(key, value);
      return;
    }
    await api.setAuthStorageItem(key, value);
  } catch (error) {
    console.warn("[Auth] Failed to write auth storage", error);
    memoryStorage.set(key, value);
  }
};

export const removeAuthStorageItem = async (key: string): Promise<void> => {
  try {
    const api = getElectronAPI();
    memoryStorage.delete(key);
    if (api?.removeAuthStorageItem) {
      await api.removeAuthStorageItem(key);
    }
  } catch (error) {
    console.warn("[Auth] Failed to remove auth storage", error);
  }
};

export const supabaseAuthStorage = {
  getItem: getAuthStorageItem,
  removeItem: removeAuthStorageItem,
  setItem: setAuthStorageItem,
};
