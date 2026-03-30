import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const helperPath = "macos/GalacticNotifier/main.swift";

test("does not open the workspace when the notification body is clicked", async () => {
  const helperSource = await readFile(helperPath, "utf-8");

  assert.match(helperSource, /case dismissActionIdentifier, UNNotificationDefaultActionIdentifier:/);
  assert.doesNotMatch(helperSource, /case UNNotificationDefaultActionIdentifier, openActionIdentifier:/);
});

test("opens the workspace from the notification action button", async () => {
  const helperSource = await readFile(helperPath, "utf-8");

  assert.match(helperSource, /case openActionIdentifier:/);
  assert.match(helperSource, /guard let launchTargets = resolveLaunchTargets\(for: response\) else \{/);
  assert.match(helperSource, /openWorkspaceTargetsAndTerminate\(launchTargets\)/);
});

test("supports relaunch-safe notification click handling", async () => {
  const helperSource = await readFile(helperPath, "utf-8");

  assert.match(helperSource, /case idle/);
  assert.match(helperSource, /private struct StoredNotificationPayload: Codable/);
  assert.match(helperSource, /private let idleTimeoutInterval: TimeInterval = 15/);
  assert.match(helperSource, /content\.userInfo = \[notificationPayloadUserInfoKey: encodedPayload\]/);
  assert.match(helperSource, /return \.idle/);
  assert.doesNotMatch(helperSource, /timeoutInterval: TimeInterval = 1800/);
});

test("does not try to override the helper icon at runtime", async () => {
  const helperSource = await readFile(helperPath, "utf-8");

  assert.doesNotMatch(helperSource, /applyApplicationIcon\(\)/);
  assert.doesNotMatch(helperSource, /NSApp\.applicationIconImage = iconImage/);
  assert.doesNotMatch(helperSource, /NSWorkspace\.shared\.icon\(forFile:/);
});
