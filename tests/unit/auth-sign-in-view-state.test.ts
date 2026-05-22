import assert from "node:assert/strict";
import test from "node:test";

import { getAuthSignInViewState } from "../../src/lib/auth-sign-in-view-state.js";

test("startup auth loading keeps provider buttons enabled", () => {
  const state = getAuthSignInViewState({
    isSignInPending: false,
  });

  assert.equal(state.providers.github.disabled, false);
  assert.equal(state.providers.google.disabled, false);
});

test("pending sign-in disables all provider buttons", () => {
  const state = getAuthSignInViewState({
    isSignInPending: true,
  });

  assert.equal(state.providers.github.disabled, true);
  assert.equal(state.providers.google.disabled, true);
});

test("idle state enables provider buttons", () => {
  const state = getAuthSignInViewState({
    isSignInPending: false,
  });

  assert.equal(state.providers.github.disabled, false);
  assert.equal(state.providers.google.disabled, false);
  assert.equal(state.providers.github.label, "Sign in with GitHub");
  assert.equal(state.providers.google.label, "Sign in with Google");
});

test("authenticated state keeps provider buttons visually stable", () => {
  const state = getAuthSignInViewState({
    isSignInPending: false,
  });

  assert.equal(state.providers.github.disabled, false);
  assert.equal(state.providers.google.disabled, false);
  assert.equal(state.providers.github.label, "Sign in with GitHub");
  assert.equal(state.providers.google.label, "Sign in with Google");
});
