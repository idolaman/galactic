import assert from "node:assert/strict";
import test from "node:test";

import {
  initialAuthSignInPendingState,
  reduceAuthSignInPendingState,
} from "../../src/lib/auth-sign-in-pending-state.js";
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

test("successful OAuth start keeps sign-in pending until retry or callback release", () => {
  const startedState = reduceAuthSignInPendingState(initialAuthSignInPendingState, {
    type: "start_requested",
  });
  const waitingForCallbackState = reduceAuthSignInPendingState(startedState, {
    started: true,
    type: "start_completed",
  });

  assert.equal(waitingForCallbackState.isSignInPending, true);
  assert.equal(waitingForCallbackState.isStartInFlight, false);
  assert.equal(waitingForCallbackState.shouldScheduleRetry, true);
});

test("failed OAuth start releases sign-in pending state", () => {
  const startedState = reduceAuthSignInPendingState(initialAuthSignInPendingState, {
    type: "start_requested",
  });
  const failedState = reduceAuthSignInPendingState(startedState, {
    started: false,
    type: "start_completed",
  });

  assert.deepEqual(failedState, initialAuthSignInPendingState);
});

test("retry timeout or callback failure releases sign-in pending state", () => {
  const waitingForCallbackState = reduceAuthSignInPendingState(
    initialAuthSignInPendingState,
    { started: true, type: "start_completed" },
  );
  const releasedState = reduceAuthSignInPendingState(waitingForCallbackState, {
    type: "released",
  });

  assert.deepEqual(releasedState, initialAuthSignInPendingState);
});
