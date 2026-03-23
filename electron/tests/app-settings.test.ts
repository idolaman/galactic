import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  DEFAULT_APP_SETTINGS,
  loadAppSettings,
  saveAppSettings,
} from "../utils/app-settings.js";

const createTempDir = () => mkdtemp(path.join(os.tmpdir(), "galactic-app-settings-"));

test("loadAppSettings returns defaults when the settings file is missing", async () => {
  const tempDir = await createTempDir();
  const settingsPath = path.join(tempDir, "settings.json");

  try {
    const settings = await loadAppSettings(settingsPath);
    assert.deepEqual(settings, DEFAULT_APP_SETTINGS);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("loadAppSettings defaults event notifications to true when the key is missing", async () => {
  const tempDir = await createTempDir();
  const settingsPath = path.join(tempDir, "settings.json");

  try {
    await writeFile(settingsPath, JSON.stringify({ quickSidebarHotkeyEnabled: true }), "utf-8");
    const settings = await loadAppSettings(settingsPath);
    assert.equal(settings.eventNotificationsEnabled, true);
    assert.equal(settings.quickSidebarHotkeyEnabled, true);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("saveAppSettings persists event notification changes across reloads", async () => {
  const tempDir = await createTempDir();
  const settingsPath = path.join(tempDir, "settings.json");

  try {
    await saveAppSettings(settingsPath, {
      ...DEFAULT_APP_SETTINGS,
      eventNotificationsEnabled: false,
      quickSidebarHotkeyEnabled: true,
    });

    const settings = await loadAppSettings(settingsPath);
    assert.equal(settings.eventNotificationsEnabled, false);
    assert.equal(settings.quickSidebarHotkeyEnabled, true);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
