import { useEffect, useMemo } from "react";
import { McpInstallBanner } from "@/components/AppSidebar/McpInstallBanner";
import { SidebarNavigation } from "@/components/AppSidebar/SidebarNavigation";
import { WorkspaceSidebarGroup } from "@/components/AppSidebar/WorkspaceSidebarGroup";
import { Sidebar, SidebarContent, useSidebar } from "@/components/ui/sidebar";
import { useProjects } from "@/hooks/use-projects";
import { buildVisibleWorkspaceSessionMap } from "@/lib/workspace-session-display";
import { useSessionStore } from "@/stores/session-store";

export function AppSidebar() {
  const { open } = useSidebar();
  const projects = useProjects();
  const { sessions, startPolling, stopPolling } = useSessionStore();
  const sessionsByPath = useMemo(
    () => buildVisibleWorkspaceSessionMap(sessions),
    [sessions],
  );

  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  return (
    <Sidebar className="border-r border-border bg-background/80 pt-12 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarContent>
        <SidebarNavigation />
        <WorkspaceSidebarGroup projects={projects} sessionsByPath={sessionsByPath} />
        <McpInstallBanner open={open} />
      </SidebarContent>
    </Sidebar>
  );
}
