export interface PostHogSessionRecordingConfig {
  enabled: boolean;
  host: string;
  projectKey: string;
}

interface SessionRecordingGateInput {
  config: PostHogSessionRecordingConfig | null | undefined;
  hasEnteredApp: boolean;
  isQuickSidebar: boolean;
}

export const DISABLED_SESSION_RECORDING_CONFIG: PostHogSessionRecordingConfig = {
  enabled: false,
  host: "",
  projectKey: "",
};

export const normalizeSessionRecordingConfig = (
  config: PostHogSessionRecordingConfig | null | undefined,
): PostHogSessionRecordingConfig => {
  if (!config) {
    return DISABLED_SESSION_RECORDING_CONFIG;
  }

  const host = config.host.trim();
  const projectKey = config.projectKey.trim();

  return {
    enabled: config.enabled && host.length > 0 && projectKey.length > 0,
    host,
    projectKey,
  };
};

export const canStartSessionRecording = ({
  config,
  hasEnteredApp,
  isQuickSidebar,
}: SessionRecordingGateInput): boolean => {
  const normalized = normalizeSessionRecordingConfig(config);
  return normalized.enabled && hasEnteredApp && !isQuickSidebar;
};
