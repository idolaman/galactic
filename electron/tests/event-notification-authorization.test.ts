import assert from "node:assert/strict";
import test from "node:test";

import { maybeAuthorizeEventNotificationsOnLaunch } from "../utils/event-notification-authorization.js";

test("maybeAuthorizeEventNotificationsOnLaunch authorizes packaged mac notifications on first launch", async () => {
  let authorizeCalls = 0;
  let statusCalls = 0;

  await maybeAuthorizeEventNotificationsOnLaunch({
    isPackaged: true,
    notificationsEnabled: true,
    notifier: {
      authorizeNotifications: async () => {
        authorizeCalls += 1;
        return {
          authorizationStatus: "authorized",
          success: true,
          supported: true,
        };
      },
      getStatus: async () => {
        statusCalls += 1;
        return {
          authorizationStatus: "not-determined",
          supported: true,
        };
      },
    },
    platform: "darwin",
  });

  assert.equal(statusCalls, 1);
  assert.equal(authorizeCalls, 1);
});

test("maybeAuthorizeEventNotificationsOnLaunch skips denied or already authorized states", async () => {
  let authorizeCalls = 0;

  await maybeAuthorizeEventNotificationsOnLaunch({
    isPackaged: true,
    notificationsEnabled: true,
    notifier: {
      authorizeNotifications: async () => {
        authorizeCalls += 1;
        return {
          authorizationStatus: "authorized",
          success: true,
          supported: true,
        };
      },
      getStatus: async () => ({
        authorizationStatus: "authorized",
        supported: true,
      }),
    },
    platform: "darwin",
  });

  assert.equal(authorizeCalls, 0);
});

test("maybeAuthorizeEventNotificationsOnLaunch skips dev or disabled notification flows", async () => {
  let statusCalls = 0;

  await maybeAuthorizeEventNotificationsOnLaunch({
    isPackaged: false,
    notificationsEnabled: true,
    notifier: {
      authorizeNotifications: async () => ({
        authorizationStatus: "authorized",
        success: true,
        supported: true,
      }),
      getStatus: async () => {
        statusCalls += 1;
        return {
          authorizationStatus: "not-determined",
          supported: true,
        };
      },
    },
    platform: "darwin",
  });

  await maybeAuthorizeEventNotificationsOnLaunch({
    isPackaged: true,
    notificationsEnabled: false,
    notifier: {
      authorizeNotifications: async () => ({
        authorizationStatus: "authorized",
        success: true,
        supported: true,
      }),
      getStatus: async () => {
        statusCalls += 1;
        return {
          authorizationStatus: "not-determined",
          supported: true,
        };
      },
    },
    platform: "darwin",
  });

  assert.equal(statusCalls, 0);
});

test("maybeAuthorizeEventNotificationsOnLaunch warns only on unexpected authorization failures", async () => {
  const warnings: string[] = [];

  await maybeAuthorizeEventNotificationsOnLaunch({
    isPackaged: true,
    logWarning: (message) => {
      warnings.push(message);
    },
    notificationsEnabled: true,
    notifier: {
      authorizeNotifications: async () => ({
        authorizationStatus: "unsupported",
        message: "Mac notifier helper not found",
        success: false,
        supported: false,
      }),
      getStatus: async () => ({
        authorizationStatus: "not-determined",
        supported: true,
      }),
    },
    platform: "darwin",
  });

  assert.deepEqual(warnings, [
    "Failed to authorize macOS notifications on launch: Mac notifier helper not found",
  ]);
});
