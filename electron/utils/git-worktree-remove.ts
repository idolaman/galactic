const NOT_WORKING_TREE_MARKER = "not a working tree";

export const isWorktreeAlreadyRemovedError = (message: string): boolean => {
  if (!message) {
    return false;
  }

  return message.toLowerCase().includes(NOT_WORKING_TREE_MARKER);
};
