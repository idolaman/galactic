import { useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { openProjectInEditor, type EditorName } from "@/services/editor";
import { getCodeWorkspacePath } from "@/services/workspace";
import { useEnvironmentManager } from "@/hooks/use-environment-manager";

export function useEditorLauncher() {
  const { toast } = useToast();
  const { environmentForTarget } = useEnvironmentManager();

  const preferredEditor = useMemo<EditorName>(() => {
    if (typeof window === "undefined") return "Cursor";
    const stored = window.localStorage.getItem("preferredEditor");
    return stored === "VSCode" ? "VSCode" : "Cursor";
  }, []);

  const launchWorkspace = async (targetPath: string) => {
    const env = environmentForTarget(targetPath);
    let openPath = targetPath;

    // Always use .code-workspace file if it exists
    const workspaceInfo = await getCodeWorkspacePath(targetPath);
    if (workspaceInfo?.exists) {
      openPath = workspaceInfo.workspacePath;
    }

    const result = await openProjectInEditor(preferredEditor, openPath);
    if (result.success) {
      toast({
        title: `Opening in ${preferredEditor}`,
        description: env ? `${targetPath} (with ${env.name} environment)` : targetPath,
      });
      return true;
    }

    toast({
      title: "Failed to open editor",
      description: result.error ?? `Unable to launch ${preferredEditor}.`,
      variant: "destructive",
    });
    return false;
  };

  return { launchWorkspace, preferredEditor };
}

