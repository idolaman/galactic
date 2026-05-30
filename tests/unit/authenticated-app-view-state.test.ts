import assert from "node:assert/strict";
import test from "node:test";

import { getAuthenticatedAppViewState } from "../../src/lib/authenticated-app-view-state.js";

test("main window unauthenticated state shows the sign-in screen", () => {
  assert.equal(
    getAuthenticatedAppViewState({
      hasUser: false,
      isQuickSidebar: false,
      status: "unauthenticated",
    }),
    "main-sign-in",
  );
});

test("quick sidebar unauthenticated state shows the passive auth-required message", () => {
  assert.equal(
    getAuthenticatedAppViewState({
      hasUser: false,
      isQuickSidebar: true,
      status: "unauthenticated",
    }),
    "quick-sidebar-auth-required",
  );
});

test("quick sidebar loading state keeps auth-required copy hidden", () => {
  assert.equal(
    getAuthenticatedAppViewState({
      hasUser: false,
      isQuickSidebar: true,
      status: "loading",
    }),
    "quick-sidebar-auth-loading",
  );
});

test("authenticated state requires a resolved user", () => {
  assert.equal(
    getAuthenticatedAppViewState({
      hasUser: true,
      isQuickSidebar: true,
      status: "authenticated",
    }),
    "authenticated",
  );
  assert.equal(
    getAuthenticatedAppViewState({
      hasUser: false,
      isQuickSidebar: false,
      status: "authenticated",
    }),
    "main-sign-in",
  );
});
