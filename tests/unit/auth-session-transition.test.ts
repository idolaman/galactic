import assert from "node:assert/strict";
import test from "node:test";

import {
  createOAuthAbandonedTransition,
  createSignedOutTransition,
  OAUTH_SIGN_IN_EXPIRED_ERROR,
} from "../../src/lib/auth-session-transition.js";

test("createOAuthAbandonedTransition unlocks sign-in with an expired sign-in error", () => {
  const transition = createOAuthAbandonedTransition();

  assert.equal(transition.status, "unauthenticated");
  assert.equal(transition.error, OAUTH_SIGN_IN_EXPIRED_ERROR);
  assert.equal(transition.authState.session, null);
  assert.equal(transition.authState.user, null);
});

test("createSignedOutTransition clears auth state while preserving cleanup failures", () => {
  const transition = createSignedOutTransition("Unable to clear signed-in storage.");

  assert.equal(transition.status, "unauthenticated");
  assert.equal(transition.error, "Unable to clear signed-in storage.");
  assert.equal(transition.authState.session, null);
  assert.equal(transition.authState.user, null);
});
