import assert from "node:assert/strict";
import test from "node:test";

import { getAuthSignInViewState } from "../../src/lib/auth-sign-in-view-state.js";

test("loading auth status disables all provider buttons", () => {
  const state = getAuthSignInViewState({
    status: "loading",
  });

  assert.equal(state.providers.github.disabled, true);
  assert.equal(state.providers.google.disabled, true);
});

test("idle unauthenticated state enables provider buttons", () => {
  const state = getAuthSignInViewState({
    status: "unauthenticated",
  });

  assert.equal(state.providers.github.disabled, false);
  assert.equal(state.providers.google.disabled, false);
  assert.equal(state.providers.github.label, "Sign in with GitHub");
  assert.equal(state.providers.google.label, "Sign in with Google");
});

test("authenticated state keeps provider buttons visually stable", () => {
  const state = getAuthSignInViewState({
    status: "authenticated",
  });

  assert.equal(state.providers.github.disabled, false);
  assert.equal(state.providers.google.disabled, false);
  assert.equal(state.providers.github.label, "Sign in with GitHub");
  assert.equal(state.providers.google.label, "Sign in with Google");
});
