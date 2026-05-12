export const AUTH_PROTOCOL_SCHEMES = {
  development: "galactic-dev",
  production: "galactic",
} as const;

export type AuthProtocolScheme =
  (typeof AUTH_PROTOCOL_SCHEMES)[keyof typeof AUTH_PROTOCOL_SCHEMES];

export const AUTH_CALLBACK_IPC_CHANNEL = "auth/callback-url";

export interface AuthCallbackDeliveryState {
  pendingUrl: string | null;
}

export interface AuthCallbackWindow {
  focus(): void;
  isDestroyed(): boolean;
  show(): void;
  webContents: {
    send(channel: string, url: string): void;
  };
}

export const getAuthProtocolScheme = (isPackaged: boolean): AuthProtocolScheme =>
  isPackaged ? AUTH_PROTOCOL_SCHEMES.production : AUTH_PROTOCOL_SCHEMES.development;

export const buildAuthCallbackUrl = (scheme: AuthProtocolScheme): string =>
  `${scheme}://auth/callback`;

export const isAuthCallbackUrl = (
  value: string,
  scheme: AuthProtocolScheme,
): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === `${scheme}:` && url.host === "auth" && url.pathname === "/callback";
  } catch {
    return false;
  }
};

export const findAuthCallbackUrlInArgs = (
  args: string[],
  scheme: AuthProtocolScheme,
): string | null => args.find((arg) => isAuthCallbackUrl(arg, scheme)) ?? null;

export const notifyMainWindowAuthCallback = (
  state: AuthCallbackDeliveryState,
  url: string,
  mainWindow: AuthCallbackWindow | null | undefined,
): boolean => {
  state.pendingUrl = url;

  if (!mainWindow || mainWindow.isDestroyed()) {
    return false;
  }

  mainWindow.webContents.send(AUTH_CALLBACK_IPC_CHANNEL, url);
  mainWindow.show();
  mainWindow.focus();
  return true;
};

export const consumePendingAuthCallbackUrl = (
  state: AuthCallbackDeliveryState,
): string | null => {
  const url = state.pendingUrl;
  state.pendingUrl = null;
  return url;
};
