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

  if (projects.length === 0) {
    return null;
  }

  const getSessionsForPath = (path: string) =>
    sessionsByPath.get(normalizeWorkspacePath(path)) ?? [];

  return (
    <SidebarGroup>
      <SidebarGroupContent className="px-2 pb-2">
        <QuickLauncherHint />
      </SidebarGroupContent>
      <SidebarGroupLabel>Workspaces</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {projects.map((project) => (
            <Collapsible key={project.id} defaultOpen className="group/collapsible" asChild>
              <SidebarMenuItem>
                <div className="group/project-item relative">
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={project.name}>
                      <FolderGit2 className="text-muted-foreground" />
                      <span>{project.name}</span>
                      <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <SidebarMenuAction
                    className="pointer-events-none opacity-0 transition-opacity group-hover/project-item:pointer-events-auto group-hover/project-item:opacity-100 group-focus-within/project-item:pointer-events-auto group-focus-within/project-item:opacity-100"
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
                  <SidebarMenuSub>
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
