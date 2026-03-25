import { DEFAULT_ERROR_TOAST_DURATION } from "./toast-defaults.js";

export type AppToastKind = "error" | "info" | "success";
export type AppToastId = string | number;

export interface AppToastOptions {
  title: string;
  action?: unknown;
  description?: string;
  duration?: number;
  onOpenChange?: (open: boolean) => void;
}

export interface AppToastMessage extends AppToastOptions {
  kind: AppToastKind;
}

export type AppToastInput = AppToastMessage | AppToastOptions;

export interface AppToastController {
  id: AppToastId;
  dismiss: () => void;
  update: (message: AppToastMessage) => void;
}

export interface AppLoadingToastHandle {
  id: AppToastId;
  dismiss: () => void;
  error: (message: AppToastInput) => AppToastController;
  info: (message: AppToastInput) => AppToastController;
  show: (message: AppToastMessage) => AppToastController;
  success: (message: AppToastInput) => void;
  update: (message: AppToastOptions) => void;
}

export interface StandardToastPayload extends AppToastOptions {
  variant: "default" | "destructive";
}

interface StandardToastController {
  id: AppToastId;
  dismiss: () => void;
  update: (payload: StandardToastPayload) => void;
}

export interface AppToastAdapter {
  dismissLoading: (id: AppToastId) => void;
  showLoading: (message: AppToastOptions) => AppToastId;
  showLoadingSuccess: (id: AppToastId, message: AppToastOptions) => void;
  showStandard: (payload: StandardToastPayload) => StandardToastController;
  updateLoading: (id: AppToastId, message: AppToastOptions) => void;
}

export const DEFAULT_LOADING_SUCCESS_DURATION = 2000;

const toToastMessage = (
  kind: AppToastKind,
  message: AppToastInput,
): AppToastMessage => {
  return "kind" in message ? { ...message, kind } : { ...message, kind };
};

const toToastOptions = (message: AppToastOptions): AppToastOptions => {
  return {
    ...(message.action !== undefined ? { action: message.action } : {}),
    ...(message.description !== undefined
      ? { description: message.description }
      : {}),
    ...(message.duration !== undefined ? { duration: message.duration } : {}),
    ...(message.onOpenChange !== undefined
      ? { onOpenChange: message.onOpenChange }
      : {}),
    title: message.title,
  };
};

const withDefaults = (message: AppToastMessage): AppToastMessage => {
  if (message.kind !== "error" || message.duration !== undefined) {
    return message;
  }

  return {
    ...message,
    duration: DEFAULT_ERROR_TOAST_DURATION,
  };
};

const toStandardPayload = (
  message: AppToastMessage,
): StandardToastPayload => {
  const normalizedMessage = withDefaults(message);

  return {
    ...toToastOptions(normalizedMessage),
    variant: normalizedMessage.kind === "error" ? "destructive" : "default",
  };
};

export const createAppToast = (adapter: AppToastAdapter) => {
  const show = (message: AppToastMessage): AppToastController => {
    const controller = adapter.showStandard(toStandardPayload(message));

    return {
      id: controller.id,
      dismiss: controller.dismiss,
      update: (nextMessage) => controller.update(toStandardPayload(nextMessage)),
    };
  };

  const error = (message: AppToastInput): AppToastController =>
    show(toToastMessage("error", message));
  const info = (message: AppToastInput): AppToastController =>
    show(toToastMessage("info", message));
  const success = (message: AppToastInput): AppToastController =>
    show(toToastMessage("success", message));

  const loading = (message: AppToastOptions): AppLoadingToastHandle => {
    const id = adapter.showLoading(message);

    return {
      id,
      dismiss: () => adapter.dismissLoading(id),
      error: (nextMessage) => {
        adapter.dismissLoading(id);
        return error(nextMessage);
      },
      info: (nextMessage) => {
        adapter.dismissLoading(id);
        return info(nextMessage);
      },
      show: (nextMessage) => {
        adapter.dismissLoading(id);
        return show(nextMessage);
      },
      success: (nextMessage) => {
        const messageWithDefaults = toToastMessage("success", nextMessage);
        adapter.showLoadingSuccess(id, {
          ...toToastOptions(messageWithDefaults),
          duration:
            messageWithDefaults.duration ??
            DEFAULT_LOADING_SUCCESS_DURATION,
        });
      },
      update: (nextMessage) => adapter.updateLoading(id, nextMessage),
    };
  };

  return {
    error,
    info,
    loading,
    show,
    success,
  };
};
