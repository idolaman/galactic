import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAuthCallbackUrl,
  findAuthCallbackUrlInArgs,
  getAuthProtocolScheme,
  isAuthCallbackUrl,
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
