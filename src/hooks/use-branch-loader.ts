import { useCallback, useRef } from "react";
import { loadProjectBranchesCore, type ToastOptions } from "@/lib/load-project-branches";
import type { StoredProject } from "@/services/projects";
import { fetchBranches, listBranches as listGitBranches } from "@/services/git";
import { getFetchBranchesToast } from "@/services/git-errors";

interface UseBranchLoaderOptions {
  setIsLoadingBranches: (loading: boolean) => void;
  setProjectBranches: (branches: string[]) => void;
  showToast: (options: ToastOptions) => void;
}

export const useBranchLoader = ({
  setIsLoadingBranches,
  setProjectBranches,
  showToast,
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
        showToast: (options) => {
          if (requestIdRef.current === requestId) {
            showToast(options);
          }
        },
      },
    );
  }, [setIsLoadingBranches, setProjectBranches, showToast]);

  return { loadProjectBranches };
};
