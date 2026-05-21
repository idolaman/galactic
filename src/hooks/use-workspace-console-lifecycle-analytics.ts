import { useEffect } from "react";
import { onWorkspaceConsoleEvent } from "@/services/workspace-console";
import {
  trackWorkspaceConsoleSessionErrored,
  trackWorkspaceConsoleSessionExited,
} from "@/services/workspace-console-analytics";

export const useWorkspaceConsoleLifecycleAnalytics = (): void => {
  useEffect(
    () =>
      onWorkspaceConsoleEvent((event) => {
        if (event.type === "exit") {
          trackWorkspaceConsoleSessionExited(event.exitCode, event.signal);
        }
        if (event.type === "error") {
          trackWorkspaceConsoleSessionErrored(event.error);
        }
      }),
    [],
  );
};
