import type { Environment } from "../types/environment.js";

export const resolveSelectedEnvironmentId = (
  selectedEnvironmentId: string | null,
  environments: Pick<Environment, "id">[],
): string | null => {
  if (environments.length === 0) {
    return null;
  }

  if (
    selectedEnvironmentId &&
    environments.some((environment) => environment.id === selectedEnvironmentId)
  ) {
    return selectedEnvironmentId;
  }

  return environments[0].id;
};
