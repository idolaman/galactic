import { useSyncExternalStore } from "react";
import {
  workspaceNeedsRelaunch,
  subscribeToRelaunchChanges,
} from "@/services/workspace-state";

const getSnapshot = () => Date.now();
const getServerSnapshot = () => 0;

export const useWorkspaceNeedsRelaunch = (path: string, currentEnvId: string | null): boolean => {
  useSyncExternalStore(subscribeToRelaunchChanges, getSnapshot, getServerSnapshot);
  return workspaceNeedsRelaunch(path, currentEnvId);
};
