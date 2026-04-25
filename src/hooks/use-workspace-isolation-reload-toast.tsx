import { useCallback } from "react";
import { Terminal } from "lucide-react";
import { WorkspaceIsolationCopyButton } from "@/components/WorkspaceIsolationCopyButton";
import { useAppToast } from "@/hooks/use-app-toast";
import type { AppToastController, AppToastOptions } from "@/lib/app-toast";
import {
  WORKSPACE_ISOLATION_AUTO_ENV_RELOAD_COMMAND,
  getWorkspaceIsolationActivationReloadDescription,
  getWorkspaceIsolationActivationReloadTitle,
  getWorkspaceIsolationAutoEnvSuccessDescription,
} from "@/lib/workspace-isolation-support";

const AUTO_ENV_SUCCESS_DURATION_MS = 10000;

interface WorkspaceIsolationReloadToastOptions extends AppToastOptions {
  kind?: "info" | "success";
  workspaceLabel?: string;
}

export const useWorkspaceIsolationReloadToast = () => {
  const { info, success } = useAppToast();

  const showReloadToast = useCallback(
    ({
      kind = "info",
      workspaceLabel,
      ...toastOptions
    }: WorkspaceIsolationReloadToastOptions) => {
      let toastController: AppToastController | null = null;

      toastController = (kind === "success" ? success : info)({
        ...toastOptions,
        action: (
          <div className="group flex min-w-0 items-center justify-between gap-3 rounded-lg border border-black/[0.04] bg-black/[0.02] px-2.5 py-1.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)] transition-all hover:border-black/10 hover:bg-background hover:shadow-sm dark:border-white/[0.04] dark:bg-white/[0.02] dark:hover:border-white/10 dark:hover:bg-background/80 shrink-0">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Terminal className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-60" />
              <code className="rounded-[4px] font-mono text-[11px] font-medium tracking-tight text-muted-foreground transition-colors group-hover:text-foreground">
                {WORKSPACE_ISOLATION_AUTO_ENV_RELOAD_COMMAND}
              </code>
            </div>
            <div className="shrink-0 -mr-0.5 opacity-100 transition-opacity sm:opacity-40 sm:focus-within:opacity-100 sm:group-hover:opacity-100">
              <WorkspaceIsolationCopyButton
                text={WORKSPACE_ISOLATION_AUTO_ENV_RELOAD_COMMAND}
                label="reload command"
                successMessage={null}
                onCopySuccess={() => {
                  setTimeout(() => toastController?.dismiss(), 1000);
                }}
              />
            </div>
          </div>
        ),
      });
    },
    [info, success],
  );

  const showAutoEnvEnabledToast = useCallback(() => {
    showReloadToast({
      kind: "success",
      title: "Terminal Auto-Env enabled",
      description: getWorkspaceIsolationAutoEnvSuccessDescription(),
      duration: AUTO_ENV_SUCCESS_DURATION_MS,
    });
  }, [showReloadToast]);

  const showActivationReloadToast = useCallback(
    (workspaceLabel: string) => {
      showReloadToast({
        title: getWorkspaceIsolationActivationReloadTitle(workspaceLabel),
        description: getWorkspaceIsolationActivationReloadDescription(
          workspaceLabel,
        ),
        duration: Infinity,
        workspaceLabel,
      });
    },
    [showReloadToast],
  );

  return {
    showActivationReloadToast,
    showAutoEnvEnabledToast,
  };
};
