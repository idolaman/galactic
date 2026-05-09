import assert from "node:assert/strict";
import test from "node:test";

import {
  AUTH_STATE_TTL_MS,
  buildAuthRedirectUrl,
  parseAuthCallbackUrl,
  validatePendingAuthState,
  type PendingAuthState,
} from "../../src/lib/auth-callback.js";

const pendingState: PendingAuthState = {
  createdAt: 1_000,
  provider: "github",
  state: "state-1",
};

test("parseAuthCallbackUrl reads code and provider errors", () => {
  const parsed = parseAuthCallbackUrl(
    "galactic://auth/callback?code=code-1&error=access_denied&error_description=Nope",
  );

  assert.deepEqual(parsed, {
    code: "code-1",
    error: "access_denied",
    errorDescription: "Nope",
  });
});

test("validatePendingAuthState accepts a matching unexpired state", () => {
  const result = validatePendingAuthState(pendingState, 1_500);

  assert.equal(result, null);
});

test("validatePendingAuthState rejects missing and expired state", () => {
  assert.equal(validatePendingAuthState(null, 1_500), "invalid_state");
  assert.equal(
    validatePendingAuthState(pendingState, 1_000 + AUTH_STATE_TTL_MS + 1),
    "invalid_state",
  );
});

test("buildAuthRedirectUrl preserves the exact callback URL Supabase allow-lists", () => {
  const url = buildAuthRedirectUrl("galactic://auth/callback");

  assert.equal(url, "galactic://auth/callback");
});
