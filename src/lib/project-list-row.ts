export const shouldActivateProjectListRowFromKey = (
  key: string,
  isRowTarget: boolean,
): boolean => isRowTarget && (key === "Enter" || key === " ");
