import assert from "node:assert/strict";
import test from "node:test";

import {
  AUTH_CALLBACK_IPC_CHANNEL,
  buildAuthCallbackUrl,
  consumePendingAuthCallbackUrl,
  findAuthCallbackUrlInArgs,
  getAuthProtocolScheme,
  isAuthCallbackUrl,
  notifyMainWindowAuthCallback,
  processAuthCallbackUrlInArgs,
  type AuthCallbackDeliveryState,
  type AuthCallbackWindow,
} from "../utils/auth-callback.js";

test("getAuthProtocolScheme separates packaged and development callbacks", () => {
  assert.equal(getAuthProtocolScheme(true), "galactic");
  assert.equal(getAuthProtocolScheme(false), "galactic-dev");
});

test("isAuthCallbackUrl accepts only the expected scheme and auth callback path", () => {
  assert.equal(isAuthCallbackUrl("galactic://auth/callback?code=1", "galactic"), true);
  assert.equal(isAuthCallbackUrl("galactic-dev://auth/callback?code=1", "galactic"), false);
  assert.equal(isAuthCallbackUrl("galactic://settings", "galactic"), false);
});

test("findAuthCallbackUrlInArgs locates protocol callback arguments", () => {
  const callbackUrl = buildAuthCallbackUrl("galactic");
  assert.equal(findAuthCallbackUrlInArgs(["--flag", `${callbackUrl}?code=1`], "galactic"), `${callbackUrl}?code=1`);
});

test("processAuthCallbackUrlInArgs processes protocol callback arguments", () => {
  const callbackUrl = `${buildAuthCallbackUrl("galactic")}?code=1`;
  const processedUrls: string[] = [];

  const processed = processAuthCallbackUrlInArgs(
    ["--flag", callbackUrl],
    "galactic",
    (url) => {
      processedUrls.push(url);
      return true;
    },
  );

  assert.equal(processed, true);
  assert.deepEqual(processedUrls, [callbackUrl]);
});

test("processAuthCallbackUrlInArgs ignores missing or invalid callback arguments", () => {
  const processedUrls: string[] = [];

  const processed = processAuthCallbackUrlInArgs(
    ["--flag", "galactic://settings"],
    "galactic",
    (url) => {
      processedUrls.push(url);
      return true;
    },
  );

  assert.equal(processed, false);
  assert.deepEqual(processedUrls, []);
});

test("notifyMainWindowAuthCallback stores one pending callback for renderer claim", () => {
  const state: AuthCallbackDeliveryState = { pendingUrl: null };
  const sentMessages: Array<[string, string]> = [];
  let focusCount = 0;
  let showCount = 0;
  const mainWindow: AuthCallbackWindow = {
    focus: () => {
      focusCount += 1;
    },
    isDestroyed: () => false,
    show: () => {
      showCount += 1;
    },
    webContents: {
      send: (channel, url) => {
        sentMessages.push([channel, url]);
      },
    },
  };

  const callbackUrl = `${buildAuthCallbackUrl("galactic")}?code=code-1`;

  assert.equal(notifyMainWindowAuthCallback(state, callbackUrl, mainWindow), true);
  assert.deepEqual(sentMessages, [[AUTH_CALLBACK_IPC_CHANNEL, callbackUrl]]);
  assert.equal(showCount, 1);
  assert.equal(focusCount, 1);
  assert.equal(consumePendingAuthCallbackUrl(state), callbackUrl);
  assert.equal(consumePendingAuthCallbackUrl(state), null);
});

test("notifyMainWindowAuthCallback keeps pending callback when main window is unavailable", () => {
  const state: AuthCallbackDeliveryState = { pendingUrl: null };
  const callbackUrl = `${buildAuthCallbackUrl("galactic")}?code=code-2`;

  assert.equal(notifyMainWindowAuthCallback(state, callbackUrl, null), false);
  assert.equal(consumePendingAuthCallbackUrl(state), callbackUrl);
});
