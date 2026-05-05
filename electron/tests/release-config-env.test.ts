import assert from "node:assert/strict";
import test from "node:test";

import {
  asOptionalBooleanFlag,
  getFirstEnvValue,
  parseEnvFile,
} from "../release-config-env.js";

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

test("asOptionalBooleanFlag parses explicit replay flags", () => {
  assert.equal(asOptionalBooleanFlag("true"), true);
  assert.equal(asOptionalBooleanFlag("1"), true);
  assert.equal(asOptionalBooleanFlag("on"), true);
  assert.equal(asOptionalBooleanFlag("false"), false);
  assert.equal(asOptionalBooleanFlag("0"), false);
  assert.equal(asOptionalBooleanFlag("off"), false);
});

test("asOptionalBooleanFlag ignores empty and unknown values", () => {
  assert.equal(asOptionalBooleanFlag(""), undefined);
  assert.equal(asOptionalBooleanFlag("sometimes"), undefined);
  assert.equal(asOptionalBooleanFlag(undefined), undefined);
});
