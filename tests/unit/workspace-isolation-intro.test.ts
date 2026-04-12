import assert from "node:assert/strict";
import test from "node:test";
import {
  getWorkspaceIsolationSupportCopy,
  WORKSPACE_ISOLATION_INJECTED_FRAMEWORKS,
  WORKSPACE_ISOLATION_PORT_READY_FRAMEWORKS,
  WORKSPACE_ISOLATION_SHELL_SUPPORT_COPY,
} from "../../src/lib/workspace-isolation-intro.js";

test("workspace isolation intro copy lists the supported stack surface from portless", () => {
  assert.deepEqual(WORKSPACE_ISOLATION_PORT_READY_FRAMEWORKS, [
    "Next.js",
    "Express",
    "Nuxt",
  ]);
  assert.deepEqual(WORKSPACE_ISOLATION_INJECTED_FRAMEWORKS, [
    "Vite",
    "Astro",
    "React Router",
    "Angular",
    "Expo",
    "React Native",
  ]);
  assert.match(
    getWorkspaceIsolationSupportCopy(),
    /Most common dev frameworks already respect PORT automatically, including Next\.js, Express, Nuxt\./,
  );
  assert.match(
    getWorkspaceIsolationSupportCopy(),
    /For Vite, Astro, React Router, Angular, Expo, React Native, Galactic handles the host and port wiring for you\./,
  );
  assert.match(
    getWorkspaceIsolationSupportCopy(),
    /SvelteKit is covered via Vite\./,
  );
});

test("workspace isolation intro copy makes the current shell limitation explicit", () => {
  assert.equal(
    WORKSPACE_ISOLATION_SHELL_SUPPORT_COPY,
    "Terminal Auto-Env currently supports zsh only.",
  );
});
