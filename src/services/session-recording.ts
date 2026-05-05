import type { PostHogConfig } from "posthog-js/dist/module.full.no-external.js";

import {
  DISABLED_SESSION_RECORDING_CONFIG,
  canStartSessionRecording,
  normalizeSessionRecordingConfig,
  type PostHogSessionRecordingConfig,
} from "./session-recording-state.js";

interface StartSessionRecordingOptions {
  hasEnteredApp: boolean;
  isQuickSidebar: boolean;
}

let initialized = false;
let recordingRequested = false;
let configPromise: Promise<PostHogSessionRecordingConfig> | null = null;
let posthogPromise: Promise<typeof import("posthog-js/dist/module.full.no-external.js").posthog> | null = null;

const loadSessionRecordingConfig = async (): Promise<PostHogSessionRecordingConfig> => {
  if (!configPromise) {
    configPromise = window.electronAPI?.getPostHogSessionRecordingConfig?.()
      .then(normalizeSessionRecordingConfig)
      .catch((error) => {
        console.warn("[SessionRecording] Failed to load PostHog config", error);
        return DISABLED_SESSION_RECORDING_CONFIG;
      }) ?? Promise.resolve(DISABLED_SESSION_RECORDING_CONFIG);
  }

  return configPromise;
};

const getPostHogReplayOptions = (host: string): Partial<PostHogConfig> => ({
  api_host: host,
  autocapture: false,
  capture_exceptions: false,
  capture_pageleave: false,
  capture_pageview: false,
  capture_performance: false,
  disable_session_recording: true,
  enable_recording_console_log: false,
  session_recording: {
    collectFonts: false,
    maskAllInputs: true,
    maskCapturedNetworkRequestFn: () => undefined,
    maskTextSelector: "*",
    recordBody: false,
    recordCrossOriginIframes: false,
    recordHeaders: false,
  },
});

const loadPostHogClient = async () => {
  if (!posthogPromise) {
    posthogPromise = import("posthog-js/dist/module.full.no-external.js").then((module) => module.posthog);
  }

  return posthogPromise;
};

export const startMaskedSessionRecording = async (
  options: StartSessionRecordingOptions,
): Promise<boolean> => {
  recordingRequested = true;

  if (typeof window === "undefined") {
    return false;
  }

  const config = await loadSessionRecordingConfig();
  if (!canStartSessionRecording({ config, ...options })) {
    return false;
  }

  try {
    const posthog = await loadPostHogClient();
    if (!recordingRequested) {
      return false;
    }

    if (!initialized) {
      posthog.init(config.projectKey, getPostHogReplayOptions(config.host));
      initialized = true;
    }

    if (!posthog.sessionRecordingStarted()) {
      posthog.startSessionRecording();
    }

    return posthog.sessionRecordingStarted();
  } catch (error) {
    console.warn("[SessionRecording] Failed to start PostHog replay", error);
    return false;
  }
};

export const stopMaskedSessionRecording = (): void => {
  recordingRequested = false;

  if (!initialized || !posthogPromise) {
    return;
  }

  void posthogPromise.then((posthog) => {
    if (posthog.sessionRecordingStarted()) {
      posthog.stopSessionRecording();
    }
  }).catch((error) => {
    console.warn("[SessionRecording] Failed to stop PostHog replay", error);
  });
};
