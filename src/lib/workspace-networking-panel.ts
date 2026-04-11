export const getWorkspaceIsolationServicesOpenState = (
  previousStackId: string | null,
  nextStackId: string | null,
  currentOpen: boolean,
): boolean => previousStackId === nextStackId ? currentOpen : false;
