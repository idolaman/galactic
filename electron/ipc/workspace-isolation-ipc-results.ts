const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export type ScopedStateFailure = { success: false; error: string };

const toFailure = (error: unknown, fallback: string): ScopedStateFailure => ({
  success: false,
  error: getErrorMessage(error, fallback),
});

export const readScopedState = <T>(
  read: () => T,
  fallback: string,
): T | ScopedStateFailure => {
  try {
    return read();
  } catch (error) {
    return toFailure(error, fallback);
  }
};

export const mutateScopedState = async <T>(
  mutate: () => Promise<T>,
  fallback: string,
): Promise<T | ScopedStateFailure> => {
  try {
    return await mutate();
  } catch (error) {
    return toFailure(error, fallback);
  }
};
