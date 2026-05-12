import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { ANALYTICS_EVENTS, isAnalyticsEvent } from "../analytics-events.js";

const extractEventNames = (sourcePath: string): string[] => {
  const source = readFileSync(sourcePath, "utf-8");
  return [...source.matchAll(/"([A-Z][A-Za-z]+(?:[A-Za-z]+)?\.[A-Za-z0-9]+)"/g)]
    .map((match) => match[1])
    .sort();
};

test("electron analytics events match the renderer analytics contract", () => {
  const rendererEvents = extractEventNames(path.join(process.cwd(), "src/types/analytics.ts"));
  const electronEvents = [...ANALYTICS_EVENTS].sort();

  assert.deepEqual(electronEvents, rendererEvents);
});

test("isAnalyticsEvent accepts every declared analytics event", () => {
  assert.equal(ANALYTICS_EVENTS.every(isAnalyticsEvent), true);
  assert.equal(isAnalyticsEvent("WorkspaceIsolation.notReal"), false);
});
