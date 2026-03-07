import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { getHookManifestPath } from "./paths.js";
import type { HookInstallManifest, HookInstallRecord, HookPlatform } from "./types.js";

const defaultManifest = (): HookInstallManifest => ({
  version: 1,
  installs: {},
});

export const readHookInstallManifest = async (homeDirectory?: string): Promise<HookInstallManifest> => {
  const manifestPath = getHookManifestPath(homeDirectory);
  if (!existsSync(manifestPath)) {
    return defaultManifest();
  }

  try {
    const content = await fs.readFile(manifestPath, "utf8");
    const parsed = JSON.parse(content) as Partial<HookInstallManifest>;
    return {
      version: 1,
      installs: parsed.installs ?? {},
    };
  } catch {
    return defaultManifest();
  }
};

export const writeHookInstallManifest = async (
  manifest: HookInstallManifest,
  homeDirectory?: string,
): Promise<void> => {
  const manifestPath = getHookManifestPath(homeDirectory);
  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
};

export const updateHookInstallRecord = async (
  platform: HookPlatform,
  record: HookInstallRecord | null,
  homeDirectory?: string,
): Promise<HookInstallManifest> => {
  const manifest = await readHookInstallManifest(homeDirectory);
  if (record) {
    manifest.installs[platform] = record;
  } else {
    delete manifest.installs[platform];
  }
  await writeHookInstallManifest(manifest, homeDirectory);
  return manifest;
};
