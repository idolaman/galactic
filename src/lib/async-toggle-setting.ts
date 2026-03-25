export interface ToggleSettingResult {
  success: boolean;
  enabled: boolean;
  error?: string;
}

interface LoadAsyncToggleSettingValueOptions {
  getValue?: () => Promise<boolean>;
  isMounted: () => boolean;
  onError: () => void;
  onLoaded: (enabled: boolean) => void;
  onSettled: () => void;
}

interface SaveAsyncToggleSettingValueOptions {
  fallbackErrorMessage: string;
  nextValue: boolean;
  onChanged: (enabled: boolean) => void;
  onError: (message: string) => void;
  previousValue: boolean;
  setValue: (enabled: boolean) => Promise<ToggleSettingResult>;
}

export const loadAsyncToggleSettingValue = async ({
  getValue,
  isMounted,
  onError,
  onLoaded,
  onSettled,
}: LoadAsyncToggleSettingValueOptions): Promise<void> => {
  if (!getValue) {
    if (isMounted()) {
      onSettled();
    }
    return;
  }

  try {
    const nextValue = await getValue();
    if (isMounted()) {
      onLoaded(nextValue);
    }
  } catch (_caughtError) {
    if (isMounted()) {
      onError();
    }
  } finally {
    if (isMounted()) {
      onSettled();
    }
  }
};

export const saveAsyncToggleSettingValue = async ({
  fallbackErrorMessage,
  nextValue,
  onChanged,
  onError,
  previousValue,
  setValue,
}: SaveAsyncToggleSettingValueOptions): Promise<void> => {
  onChanged(nextValue);

  try {
    const result = await setValue(nextValue);
    if (!result.success) {
      onChanged(result.enabled ?? previousValue);
      onError(result.error ?? fallbackErrorMessage);
      return;
    }

    onChanged(result.enabled);
  } catch (_caughtError) {
    onChanged(previousValue);
    onError(fallbackErrorMessage);
  }
};
