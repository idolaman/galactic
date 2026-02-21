import { useCallback, useRef } from "react";
import { loadProjectBranchesCore, type ToastOptions } from "@/lib/load-project-branches";
import type { StoredProject } from "@/services/projects";
import { fetchBranches, listBranches as listGitBranches } from "@/services/git";
import { getFetchBranchesToast } from "@/services/git-errors";

interface UseBranchLoaderOptions {
  setIsLoadingBranches: (loading: boolean) => void;
  setProjectBranches: (branches: string[]) => void;
  toast: (options: ToastOptions) => void;
}

export const useBranchLoader = ({
  setIsLoadingBranches,
  setProjectBranches,
  toast,
}: UseBranchLoaderOptions) => {
  const requestIdRef = useRef(0);

  const loadProjectBranches = useCallback(async (project: StoredProject | null) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    await loadProjectBranchesCore(
      project,
      {
        fetchBranches,
        listBranches: listGitBranches,
        getFetchBranchesToast,
      },
      {
        setIsLoadingBranches: (isLoading) => {
          if (requestIdRef.current === requestId) {
            setIsLoadingBranches(isLoading);
          }
        },
        setProjectBranches: (branches) => {
          if (requestIdRef.current === requestId) {
            setProjectBranches(branches);
          }
        },
        toast: (options) => {
          if (requestIdRef.current === requestId) {
            toast(options);
          }
        },
      },
    );
  }, [setIsLoadingBranches, setProjectBranches, toast]);

  const clearProjectBranches = useCallback(() => {
    requestIdRef.current += 1;
    setProjectBranches([]);
    setIsLoadingBranches(false);
  }, [setIsLoadingBranches, setProjectBranches]);

  return { loadProjectBranches, clearProjectBranches };
};
