import assert from "node:assert/strict";
import test from "node:test";
import type { Session } from "@supabase/supabase-js";

import {
  createAuthSessionTransition,
  emptyAuthSession,
  getAuthCallbackFailureStatus,
} from "../../src/lib/auth-session-transition.js";
import type { AuthUser } from "../../src/types/auth.js";

const createSession = (): Session => ({
  access_token: "access-token",
  expires_in: 3600,
  refresh_token: "refresh-token",
  token_type: "bearer",
  user: {
    app_metadata: {},
    aud: "authenticated",
    created_at: "2026-01-01T00:00:00.000Z",
    email: "dev@example.com",
    id: "user-1",
    user_metadata: { name: "Dev User" },
  },
} as Session);

const toAuthUser = (user: Session["user"]): AuthUser => ({
  avatarUrl: null,
  email: user.email ?? null,
  id: user.id,
  name: "Dev User",
});

test("createAuthSessionTransition blocks null session when scope clear fails", async () => {
  const result = await createAuthSessionTransition(null, {
    activate: async () => ({ success: true }),
    clear: async () => ({ success: false, error: "clear failed" }),
    toUser: toAuthUser,
  });

  assert.equal(result.success, false);
  assert.equal(result.error, "clear failed");
  assert.equal("authState" in result, false);
  assert.equal("status" in result, false);
});

test("createAuthSessionTransition treats thrown clear failures as failed transitions", async () => {
  const result = await createAuthSessionTransition(null, {
    activate: async () => ({ success: true }),
    clear: async () => {
      throw new Error("clear threw");
    },
    toUser: toAuthUser,
  });

  assert.equal(result.success, false);
  assert.equal(result.error, "clear threw");
});

test("createAuthSessionTransition clears auth state when activation fails", async () => {
  const result = await createAuthSessionTransition(createSession(), {
    activate: async () => ({ success: false, error: "activate failed" }),
    clear: async () => ({ success: true }),
    toUser: toAuthUser,
  });

  assert.deepEqual(result, {
    authState: emptyAuthSession,
    error: "activate failed",
    status: "unauthenticated",
    success: false,
  });
});

test("createAuthSessionTransition builds authenticated state after scope activation", async () => {
  const session = createSession();
  const result = await createAuthSessionTransition(session, {
    activate: async () => ({ success: true }),
    clear: async () => ({ success: true }),
    toUser: toAuthUser,
  });

  assert.equal(result.success, true);
  assert.equal(result.status, "authenticated");
  assert.equal(result.authState.session, session);
  assert.equal(result.authState.user?.id, "user-1");
  assert.equal(result.authState.user?.name, "Dev User");
});

test("getAuthCallbackFailureStatus preserves authenticated state when a session exists", () => {
  assert.equal(
    getAuthCallbackFailureStatus({
      session: createSession(),
      user: {
        avatarUrl: null,
        email: "dev@example.com",
        id: "user-1",
        name: "Dev User",
      },
    }),
    "authenticated",
  );
});

test("getAuthCallbackFailureStatus returns unauthenticated without a session", () => {
  assert.equal(getAuthCallbackFailureStatus(emptyAuthSession), "unauthenticated");
});
