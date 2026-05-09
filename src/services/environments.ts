import type { Environment, EnvironmentBinding } from "@/types/environment";
import {
  PRODUCT_STORAGE_UNAVAILABLE_ERROR,
  getLocalStorage,
  getProductStorageKey,
} from "@/services/local-storage-scope";

const STORAGE_DATASET = "environments";

const safeParse = (raw: string | null): Environment[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Failed to parse stored environments:", error);
    return [];
  }
};

const readAll = (): Environment[] => {
  const storage = getLocalStorage();
  const storageKey = getProductStorageKey(STORAGE_DATASET);
  if (!storage) throw new Error(PRODUCT_STORAGE_UNAVAILABLE_ERROR);
  return safeParse(storage.getItem(storageKey));
};

const writeAll = (environments: Environment[]): void => {
  const storage = getLocalStorage();
  const storageKey = getProductStorageKey(STORAGE_DATASET);
  if (!storage) throw new Error(PRODUCT_STORAGE_UNAVAILABLE_ERROR);
  try {
    storage.setItem(storageKey, JSON.stringify(environments));
  } catch (error) {
    console.warn("Failed to save environments:", error);
  }
};

export const environmentStorage = {
  load(): Environment[] {
    return readAll();
  },
  save(environments: Environment[]): void {
    writeAll(environments);
  },
  upsert(environment: Environment): Environment[] {
    const next = [...readAll()];
    const existingIndex = next.findIndex((item) => item.id === environment.id);
    if (existingIndex >= 0) {
      next[existingIndex] = environment;
    } else {
      next.unshift(environment);
    }
    writeAll(next);
    return next;
  },
  remove(environmentId: string): Environment[] {
    const next = readAll().filter((env) => env.id !== environmentId);
    writeAll(next);
    return next;
  },
};

const parseOctet = (address: string): number | null => {
  const parts = address.trim().split(".");
  const last = parts[parts.length - 1];
  const parsed = Number.parseInt(last ?? "", 10);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
};

export const nextLoopbackAddress = (environments: Environment[]): string | null => {
  const used = new Set<number>();
  environments.forEach((env) => {
    const octet = parseOctet(env.address);
    if (octet !== null) {
      used.add(octet);
    }
  });

  for (let octet = 2; octet < 255; octet += 1) {
    if (!used.has(octet)) {
      return `127.0.0.${octet}`;
    }
  }

  return null;
};

export const findEnvironmentOwningTarget = (
  environments: Environment[],
  targetPath: string,
): { environment: Environment; binding: EnvironmentBinding } | null => {
  for (const environment of environments) {
    const binding = environment.bindings.find((entry) => entry.targetPath === targetPath);
    if (binding) {
      return { environment, binding };
    }
  }
  return null;
};

export type EnvironmentCommandAction = "add" | "remove";

export const runEnvironmentCommand = async (
  action: EnvironmentCommandAction,
  address: string,
): Promise<{ success: boolean; output?: string; error?: string }> => {
  if (typeof window === "undefined") {
    return { success: false, error: "Environment commands are only available in the desktop app." };
  }

  try {
    const result = await window.electronAPI?.configureEnvironmentInterface?.(action, address);
    if (!result) {
      return { success: false, error: "Environment IPC bridge is unavailable." };
    }
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown environment command error.",
    };
  }
};
