import { useEffect, useMemo } from "react";
import { SidebarNavigation } from "@/components/AppSidebar/SidebarNavigation";
import { WorkspaceSidebarGroup } from "@/components/AppSidebar/WorkspaceSidebarGroup";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { useProjects } from "@/hooks/use-projects";
import { buildVisibleWorkspaceSessionMap } from "@/lib/workspace-session-display";
import { useSessionStore } from "@/stores/session-store";

export function AppSidebar() {
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
    <Sidebar className="border-r border-sidebar-border bg-sidebar pt-12 text-sidebar-foreground">
      <SidebarContent className="gap-1 overflow-hidden py-2">
        <SidebarNavigation />
        <WorkspaceSidebarGroup projects={projects} sessionsByPath={sessionsByPath} />
      </SidebarContent>
    </Sidebar>
  );
}
