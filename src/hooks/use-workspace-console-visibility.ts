import { useCallback, useEffect, useState } from "react";
import {
  trackWorkspaceConsoleHidden,
  trackWorkspaceConsoleRestored,
  trackWorkspaceConsoleSizeChanged,
} from "@/services/workspace-console-analytics";
import type { WorkspaceConsoleStatus } from "@/types/workspace-console";

interface WorkspaceConsoleVisibilityInput {
  activeStatus?: WorkspaceConsoleStatus;
  sessionCount: number;
}

export const useWorkspaceConsoleVisibility = ({
  activeStatus,
  sessionCount,
}: WorkspaceConsoleVisibilityInput) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (sessionCount === 0) {
      setIsExpanded(false);
      setIsOpen(false);
    }
  }, [sessionCount]);

  const collapseConsole = useCallback(() => {
    trackWorkspaceConsoleSizeChanged("docked", sessionCount);
    setIsExpanded(false);
  }, [sessionCount]);

  const expandConsole = useCallback(() => {
    trackWorkspaceConsoleSizeChanged("expanded", sessionCount);
    setIsExpanded(true);
  }, [sessionCount]);

  const hideDock = useCallback(() => {
    trackWorkspaceConsoleHidden({ sessionCount, status: activeStatus });
    setIsOpen(false);
  }, [activeStatus, sessionCount]);

  const showDock = useCallback(() => {
    trackWorkspaceConsoleRestored(sessionCount);
    setIsOpen(true);
  }, [sessionCount]);

  return {
    collapseConsole,
    expandConsole,
    hideDock,
    isExpanded,
    isOpen,
    openDock: () => setIsOpen(true),
    showDock,
  };
};
