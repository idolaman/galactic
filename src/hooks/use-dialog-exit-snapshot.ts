import { useCallback, useEffect, useState } from "react";

import {
  getNextDialogSnapshot,
  shouldClearDialogSnapshotAfterExit,
} from "@/lib/dialog-exit-snapshot";

export const useDialogExitSnapshot = <T>(source: T | null) => {
  const [snapshot, setSnapshot] = useState<T | null>(source);

  useEffect(() => {
    setSnapshot((current) => getNextDialogSnapshot(source, current));
  }, [source]);

  const handleExitComplete = useCallback(() => {
    if (shouldClearDialogSnapshotAfterExit(source)) {
      setSnapshot(null);
    }
  }, [source]);

  return {
    snapshot,
    handleExitComplete,
  };
};
