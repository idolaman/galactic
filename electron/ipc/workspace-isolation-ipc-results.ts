const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

const toFailure = (error: unknown, fallback: string) => ({
  success: false,
  error: getErrorMessage(error, fallback),
});

export const readScopedState = <T>(read: () => T, fallback: string) => {
  try {
    return read();
  } catch (error) {
    return toFailure(error, fallback);
  }
};

export const mutateScopedState = async <T>(
  mutate: () => Promise<T>,
  fallback: string,
) => {
  try {
    return await mutate();
  } catch (error) {
    return toFailure(error, fallback);
  }
};
