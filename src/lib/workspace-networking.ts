export const getLegacyLocalEnvironmentSummary = (
  environmentName: string | null,
): string | null => environmentName
  ? `Using ${environmentName}`
  : null;
