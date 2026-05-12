import {
  PRODUCT_STORAGE_AUTH_REQUIRED_ERROR,
  PRODUCT_STORAGE_UNAVAILABLE_ERROR,
} from "../services/local-storage-scope.js";

interface LoadProjectsForActiveScopeOptions<Project> {
  getActiveUserId: () => string | null;
  loadProjects: () => Project[];
}

const isProductStorageScopeError = (error: unknown): boolean =>
  error instanceof Error &&
  (error.message === PRODUCT_STORAGE_AUTH_REQUIRED_ERROR ||
    error.message === PRODUCT_STORAGE_UNAVAILABLE_ERROR);

export const loadProjectsForActiveScope = <Project>({
  getActiveUserId,
  loadProjects,
}: LoadProjectsForActiveScopeOptions<Project>): Project[] => {
  if (!getActiveUserId()) {
    return [];
  }

  try {
    return loadProjects();
  } catch (error) {
    if (isProductStorageScopeError(error)) {
      return [];
    }
    throw error;
  }
};
