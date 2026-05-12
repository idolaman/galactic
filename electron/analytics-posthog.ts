import { createRequire } from "node:module";

import { capturePostHogClientEvent, type PostHogClient } from "./analytics-capture.js";
import type { AnalyticsEvent } from "./analytics-events.js";
import type { AnalyticsContext, AnalyticsPayload } from "./analytics-payloads.js";
import { getPostHogHost, getPostHogProjectKey } from "./release-config.js";

export type { PostHogClient } from "./analytics-capture.js";

const nodeRequire = createRequire(import.meta.url);
const { PostHog } = nodeRequire("posthog-node") as typeof import("posthog-node");
let postHogClient: PostHogClient | null = null;

export const createPostHogClient = (projectKey: string, host: string): PostHogClient =>
  new PostHog(projectKey, {
    disableGeoip: true,
    host,
    privacyMode: true,
  });

export const initPostHog = (
  createClient: typeof createPostHogClient = createPostHogClient,
): void => {
  if (postHogClient) return;

  const projectKey = getPostHogProjectKey();
  if (!projectKey) {
    console.log("[Analytics] PostHog disabled - no project key configured");
    return;
  }

  try {
    postHogClient = createClient(projectKey, getPostHogHost());
    console.log("[Analytics] PostHog initialized");
  } catch (error) {
    console.error("[Analytics] Failed to initialize PostHog:", error);
  }
};

export const capturePostHogEvent = (
  event: AnalyticsEvent,
  distinctId: string,
  context: AnalyticsContext,
  payload?: AnalyticsPayload,
): void => {
  capturePostHogClientEvent(postHogClient, event, distinctId, context, payload);
};

export const shutdownPostHog = async (): Promise<void> => {
  if (!postHogClient) return;

  const client = postHogClient;
  postHogClient = null;
  await client.shutdown(5000);
};
