import type { ToastActionElement } from "@/components/ui/toast";
import { toast as sonnerToast } from "@/components/ui/sonner";
import { toast as baseToast } from "@/hooks/use-toast";
import {
  createAppToast,
  type StandardToastPayload,
} from "@/lib/app-toast";

type BaseToastUpdate = Parameters<
  ReturnType<typeof baseToast>["update"]
>[0];

const toBaseToastPayload = (payload: StandardToastPayload) => {
  return {
    action: payload.action as ToastActionElement | undefined,
    description: payload.description,
    duration: payload.duration,
    onOpenChange: payload.onOpenChange,
    title: payload.title,
    variant: payload.variant,
  };
};

const appToast = createAppToast({
  dismissLoading: (id) => sonnerToast.dismiss(id),
  showLoading: (message) =>
    sonnerToast.loading(message.title, {
      description: message.description,
      duration: message.duration,
    }),
  showLoadingSuccess: (id, message) => {
    sonnerToast.success(message.title, {
      description: message.description,
      duration: message.duration,
      id,
    });
  },
  showStandard: (payload) => {
    const controller = baseToast(toBaseToastPayload(payload));

    return {
      id: controller.id,
      dismiss: controller.dismiss,
      update: (nextPayload) =>
        controller.update(toBaseToastPayload(nextPayload) as BaseToastUpdate),
    };
  },
  updateLoading: (id, message) => {
    sonnerToast.loading(message.title, {
      description: message.description,
      duration: message.duration,
      id,
    });
  },
});

export function useAppToast() {
  return appToast;
}

export { appToast };
