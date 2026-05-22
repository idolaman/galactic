import { ArrowUpRight, ChevronRight, FolderGit2, GitBranch, HardDrive } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { QuickLauncherHint } from "@/components/QuickLauncherHint";
import { SidebarWorkspaceItem } from "@/components/AppSidebar/SidebarWorkspaceItem";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  useSidebar,
} from "@/components/ui/sidebar";
import { normalizeWorkspacePath } from "@/lib/workspace-session-display";
import type { SessionSummary } from "@/services/session-rpc";
import type { StoredProject } from "@/services/projects";

export interface WorkspaceSidebarGroupProps {
  projects: StoredProject[];
  sessionsByPath: Map<string, SessionSummary[]>;
}

export function WorkspaceSidebarGroup({
  projects,
  sessionsByPath,
}: WorkspaceSidebarGroupProps) {
  const navigate = useNavigate();
  const { open } = useSidebar();

  if (projects.length === 0) {
    return null;
  }

  const getSessionsForPath = (path: string) =>
    sessionsByPath.get(normalizeWorkspacePath(path)) ?? [];

  return (
    <SidebarGroup className="min-h-0 flex-1 px-2 py-1">
      {open && (
        <SidebarGroupContent className="pb-2">
          <QuickLauncherHint />
        </SidebarGroupContent>
      )}
      <SidebarGroupLabel className="h-7 px-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Projects
      </SidebarGroupLabel>
      <SidebarGroupContent className="min-h-0 overflow-y-auto">
        <SidebarMenu className="gap-0.5">
          {projects.map((project) => (
            <Collapsible key={project.id} defaultOpen className="group/collapsible" asChild>
              <SidebarMenuItem>
                <div className="group/project-item relative">
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={project.name}
                      className="h-8 pr-7 text-sidebar-foreground/85 hover:text-sidebar-accent-foreground"
                    >
                      <FolderGit2 className="text-muted-foreground" />
                      <span className="truncate">{project.name}</span>
                      <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <SidebarMenuAction
                    className="pointer-events-none right-1.5 top-1.5 h-5 w-5 opacity-0 transition-opacity group-hover/project-item:pointer-events-auto group-hover/project-item:opacity-100 group-focus-within/project-item:pointer-events-auto group-focus-within/project-item:opacity-100"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      navigate({
                        pathname: "/",
                        search: `?project=${encodeURIComponent(project.id)}`,
                      });
                    }}
                    aria-label={`Jump to ${project.name}`}
                    title={`Jump to ${project.name}`}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </SidebarMenuAction>
                </div>
                <CollapsibleContent>
                  <SidebarMenuSub className="mx-3.5 gap-0.5 border-sidebar-border px-2 py-1">
                    <SidebarWorkspaceItem
                      path={project.path}
                      name="Repository Root"
                      icon={HardDrive}
                      variant="root"
                      sessions={getSessionsForPath(project.path)}
                    />
                    {(project.workspaces ?? []).map((workspace) => (
                      <SidebarWorkspaceItem
                        key={workspace.workspace}
                        path={workspace.workspace}
                        name={workspace.name}
                        icon={GitBranch}
                        sessions={getSessionsForPath(workspace.workspace)}
                      />
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
