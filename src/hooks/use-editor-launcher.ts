import { useToast } from "@/hooks/use-toast";
import { getPreferredEditor, openProjectInEditor } from "@/services/editor";
import { getCodeWorkspacePath } from "@/services/workspace";
import { useEnvironmentManager } from "@/hooks/use-environment-manager";
import { trackQuickLauncherWorkspaceOpened } from "@/services/analytics";

export function useEditorLauncher() {
  const { toast } = useToast();
  const { environmentForTarget } = useEnvironmentManager();

  const launchWorkspace = async (targetPath: string) => {
    const env = environmentForTarget(targetPath);
    const preferredEditor = getPreferredEditor();
    let openPath = targetPath;
    const source =
      typeof window !== "undefined" && window.location.hash.includes("quick-sidebar")
        ? "quick-sidebar"
        : "main";

    // Always use .code-workspace file if it exists
    const workspaceInfo = await getCodeWorkspacePath(targetPath);
    if (workspaceInfo?.exists) {
      openPath = workspaceInfo.workspacePath;
    }

    const result = await openProjectInEditor(preferredEditor, openPath);
    if (result.success) {
      if (source === "quick-sidebar") {
        const targetType = env ? "with-env" : "standard";
        trackQuickLauncherWorkspaceOpened(targetType, source);
      }
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

  return { launchWorkspace };
}
