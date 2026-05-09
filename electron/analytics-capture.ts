import type { AnalyticsEvent } from "./analytics-events.js";
import { buildPostHogProperties, buildTelemetryDeckPayload, type AnalyticsContext, type AnalyticsPayload } from "./analytics-payloads.js";

export interface PostHogClient {
  capture: (message: { distinctId: string; event: string; properties: AnalyticsPayload }) => void;
  shutdown: (shutdownTimeoutMs?: number) => Promise<void>;
}

export interface TelemetryDeckClient {
  signal: (event: string, payload: Record<string, string>) => void;
}

export const capturePostHogClientEvent = (
  client: PostHogClient | null,
  event: AnalyticsEvent,
  distinctId: string,
  context: AnalyticsContext,
  payload?: AnalyticsPayload,
): void => {
  if (!client) return;

  try {
    client.capture({
      distinctId,
      event,
      properties: buildPostHogProperties(event, payload, context),
    });
  } catch (error) {
    console.error("[Analytics] Failed to track PostHog event:", event, error);
  }
};

export const captureTelemetryDeckClientEvent = (
  client: TelemetryDeckClient | null,
  event: AnalyticsEvent,
  context: AnalyticsContext,
  payload?: AnalyticsPayload,
): void => {
  if (!client) return;

  try {
    client.signal(event, buildTelemetryDeckPayload(payload, context));
  } catch (error) {
    console.error("[Analytics] Failed to track TelemetryDeck event:", event, error);
  }
};
