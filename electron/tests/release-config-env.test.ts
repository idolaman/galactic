import assert from "node:assert/strict";
import test from "node:test";

import { getFirstEnvValue, parseEnvFile } from "../release-config-env.js";

test("parseEnvFile reads development env values without shell evaluation", () => {
  const values = parseEnvFile(`
    # comment
    POSTHOG_PROJECT_KEY="phc_dev"
    POSTHOG_HOST='https://us.i.posthog.com'
    EMPTY=
    MALFORMED
  `);

  assert.deepEqual(values, {
    EMPTY: "",
    POSTHOG_HOST: "https://us.i.posthog.com",
    POSTHOG_PROJECT_KEY: "phc_dev",
  });
});

test("getFirstEnvValue supports legacy PostHog wizard aliases", () => {
  const values = {
    POSTHOG_PROJECT_KEY: "",
    VITE_PUBLIC_POSTHOG_KEY: "phc_legacy",
  };

  assert.equal(
    getFirstEnvValue(values, "POSTHOG_PROJECT_KEY", "VITE_PUBLIC_POSTHOG_KEY"),
    "phc_legacy",
  );
});
