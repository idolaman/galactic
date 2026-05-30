export const AUTH_PROTOCOL_SCHEMES = {
  development: "galactic-dev",
  production: "galactic",
} as const;

export type AuthProtocolScheme =
  (typeof AUTH_PROTOCOL_SCHEMES)[keyof typeof AUTH_PROTOCOL_SCHEMES];

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
