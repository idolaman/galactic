export const getNextDialogSnapshot = <T>(
  source: T | null,
  currentSnapshot: T | null,
): T | null => source ?? currentSnapshot;

export const shouldClearDialogSnapshotAfterExit = <T>(
  source: T | null,
): boolean => source === null;
