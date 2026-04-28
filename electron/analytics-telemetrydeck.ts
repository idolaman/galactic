import TelemetryDeck from "@telemetrydeck/sdk";
import crypto from "node:crypto";

import { captureTelemetryDeckClientEvent, type TelemetryDeckClient } from "./analytics-capture.js";
import type { AnalyticsEvent } from "./analytics-events.js";
import type { AnalyticsPayload, AnalyticsContext } from "./analytics-payloads.js";
import { getTelemetryDeckAppId } from "./release-config.js";

let telemetryClient: TelemetryDeckClient | null = null;

export const createTelemetryDeckClient = (
  appId: string,
  distinctId: string,
): TelemetryDeckClient =>
  new TelemetryDeck({
    appID: appId,
    clientUser: distinctId,
    subtleCrypto: crypto.webcrypto.subtle as never,
  });

export const initTelemetryDeck = (
  distinctId: string,
  createClient: typeof createTelemetryDeckClient = createTelemetryDeckClient,
): void => {
  if (telemetryClient) return;

  const telemetryDeckAppId = getTelemetryDeckAppId();
  if (!telemetryDeckAppId) {
    console.log("[Analytics] TelemetryDeck disabled - no app ID configured");
    return;
  }

  try {
    telemetryClient = createClient(telemetryDeckAppId, distinctId);
    console.log("[Analytics] TelemetryDeck initialized");
  } catch (error) {
    console.error("[Analytics] Failed to initialize TelemetryDeck:", error);
  }
};

export const captureTelemetryDeckEvent = (
  event: AnalyticsEvent,
  context: AnalyticsContext,
  payload?: AnalyticsPayload,
): void => {
  captureTelemetryDeckClientEvent(telemetryClient, event, context, payload);
};
