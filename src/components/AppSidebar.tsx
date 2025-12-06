import { FolderGit2, Settings2, Settings as SettingsIcon, Rocket, ChevronRight, HardDrive, GitBranch, RefreshCw, AlertTriangle } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/hooks/use-projects";
import { useEditorLauncher } from "@/hooks/use-editor-launcher";
import { workspaceNeedsRelaunch, clearWorkspaceRelaunchFlag } from "@/services/workspace-state";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Projects", url: "/", icon: FolderGit2 },
  { title: "Environments", url: "/environments", icon: Settings2 },
  { title: "Settings", url: "/settings", icon: SettingsIcon },
];

interface SidebarWorkspaceItemProps {
  path: string;
  name: string;
  icon: React.ElementType;
  variant?: "default" | "root";
}

function SidebarWorkspaceItem({ path, name, icon: Icon, variant = "default" }: SidebarWorkspaceItemProps) {
  const { launchWorkspace } = useEditorLauncher();
  const [showDialog, setShowDialog] = useState(false);
  const needsRelaunch = workspaceNeedsRelaunch(path);

  const handleLaunch = () => {
    launchWorkspace(path);
    clearWorkspaceRelaunchFlag(path);
    setShowDialog(false);
  };

  const onClick = () => {
    if (needsRelaunch) {
      setShowDialog(true);
    } else {
      handleLaunch();
    }
  };

  return (
    <>
      <SidebarMenuSubItem>
        <SidebarMenuSubButton onClick={onClick} className="group/item cursor-pointer">
          <Icon className={cn("h-4 w-4", variant === "root" ? "text-primary/70" : "text-muted-foreground")} />
          <span className="truncate">{name}</span>
          {needsRelaunch && (
            <RefreshCw className="ml-auto h-3 w-3 text-orange-500 animate-pulse" />
          )}
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Relaunch Required</AlertDialogTitle>
            <AlertDialogDescription>
              To apply environment changes, you must manually close the existing editor window for this workspace.
              <br />
              <br />
              Once closed, click <strong>Launch</strong> to re-open it with the new settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="secondary"
              onClick={() => launchWorkspace(path)}
            >
              Focus Window
            </Button>
            <AlertDialogAction onClick={handleLaunch}>
              Launch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function AppSidebar() {
  const { open } = useSidebar();
  const projects = useProjects();

  return (
    <Sidebar className="border-r border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-12">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                      activeClassName="bg-muted text-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {projects.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Workspaces</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {projects.map((project) => (
                  <Collapsible key={project.id} defaultOpen={false} className="group/collapsible" asChild>
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={project.name}>
                          <FolderGit2 className="text-muted-foreground" />
                          <span>{project.name}</span>
                          <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {/* Repository Root */}
                          <SidebarWorkspaceItem 
                            path={project.path} 
                            name="Repository Root" 
                            icon={HardDrive}
                            variant="root"
                          />
                          
                          {/* Active Workspaces */}
                          {project.workspaces?.map((ws) => (
                            <SidebarWorkspaceItem
                              key={ws.workspace}
                              path={ws.workspace}
                              name={ws.name}
                              icon={GitBranch}
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
        )}

        <SidebarGroup className="mt-auto px-2">
          <SidebarGroupContent>
            {open ? (
              <div className="relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-violet-950/30 via-slate-950/50 to-slate-950/80 text-white shadow-sm">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.25),transparent_45%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,hsl(var(--primary)/0.15),transparent_40%)]" />
                <div className="relative flex flex-col gap-3 p-3">
                  <div className="flex items-start gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold leading-tight">Install Galactic MCP</p>
                      <p className="text-xs text-white/80">
                        Monitor AI agent statuses automatically with the Galactic MCP running beside your workspace.
                      </p>
                    </div>
                  </div>
                  <NavLink to="/settings#mcp-installation" className="w-full">
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full bg-white text-slate-900 shadow-none transition-colors hover:bg-white/90"
                    >
                      Install now
                    </Button>
                  </NavLink>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-full justify-center border border-dashed border-border text-muted-foreground"
                aria-label="Install Galactic MCP"
              >
                <Rocket className="h-4 w-4" />
              </Button>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
