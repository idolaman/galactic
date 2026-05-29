import { useRef, useState } from "react";

import { listBranches } from "@/services/git";

export const useCreateWorkspaceBaseBranches = (projectPath: string) => {
  const requestIdRef = useRef(0);
  const [baseBranches, setBaseBranches] = useState<string[]>([]);
  const [isLoadingBaseBranches, setIsLoadingBaseBranches] = useState(false);

  const resetBaseBranches = () => {
    requestIdRef.current += 1;
    setBaseBranches([]);
    setIsLoadingBaseBranches(false);
  };

  const loadBaseBranches = async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoadingBaseBranches(true);
    try {
      const branches = await listBranches(projectPath, { scope: "local" });
      if (requestIdRef.current === requestId) {
        setBaseBranches(branches);
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setIsLoadingBaseBranches(false);
      }
    }
  };

  return {
    baseBranches,
    isLoadingBaseBranches,
    loadBaseBranches,
    resetBaseBranches,
  };
};
