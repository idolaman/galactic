import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promises as fs } from "node:fs";
import { removeStringArraySetting, upsertStringArraySetting } from "../hooks/json-settings.js";

test("upsertStringArraySetting appends without disturbing unrelated settings", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "galactic-json-settings-"));
  const settingsPath = path.join(root, "settings.json");
  await fs.writeFile(settingsPath, '{\n  // keep this\n  "editor.fontSize": 14,\n  "chat.hookFilesLocations": ["/existing"]\n}\n', "utf8");

  const result = await upsertStringArraySetting(settingsPath, "chat.hookFilesLocations", "/galactic/hooks.json");
  const content = await fs.readFile(settingsPath, "utf8");

  assert.equal(result.changed, true);
  assert.match(content, /"editor\.fontSize": 14/);
  assert.match(content, /"\/existing"/);
  assert.match(content, /"\/galactic\/hooks\.json"/);
});

test("removeStringArraySetting removes only the Galactic value", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "galactic-json-settings-"));
  const settingsPath = path.join(root, "settings.json");
  await fs.writeFile(settingsPath, JSON.stringify({ "chat.hookFilesLocations": ["/existing", "/galactic/hooks.json"] }, null, 2), "utf8");

  const result = await removeStringArraySetting(settingsPath, "chat.hookFilesLocations", "/galactic/hooks.json");
  const parsed = JSON.parse(await fs.readFile(settingsPath, "utf8")) as { "chat.hookFilesLocations": string[] };

  assert.equal(result.changed, true);
  assert.deepEqual(parsed["chat.hookFilesLocations"], ["/existing"]);
});
