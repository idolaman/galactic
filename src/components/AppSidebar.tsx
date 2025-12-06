import { useEffect } from "react";
import { FolderGit2, Settings2, Settings as SettingsIcon, Rocket, ChevronRight, HardDrive, GitBranch, RefreshCw, Check, X } from "lucide-react";
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
import { useSessionStore } from "@/stores/session-store";

const navItems = [
  { title: "Projects", url: "/", icon: FolderGit2 },
  { title: "Environments", url: "/environments", icon: Settings2 },
  { title: "Settings", url: "/settings", icon: SettingsIcon },
];

// Compact session item for the tree
function SidebarSessionItem({ session }: { session: import("@/services/session-rpc").SessionSummary }) {
  const ackSession = useSessionStore(s => s.ackSession);
  const [isOverdue, setIsOverdue] = useState(false);

  const isDone = session.status === 'done';
  const isApproval = !isDone && !!session.approval_pending_since;

  useEffect(() => {
    if (isDone || !session.started_at || !session.estimated_duration) {
      setIsOverdue(false);
      return;
    }

    const checkOverdue = () => {
      const start = new Date(session.started_at!).getTime();
      const now = Date.now();
      const elapsedSeconds = (now - start) / 1000;
      setIsOverdue(elapsedSeconds > (session.estimated_duration! * 2));
    };

    checkOverdue();
    const interval = setInterval(checkOverdue, 1000);
    return () => clearInterval(interval);
  }, [session.started_at, session.estimated_duration, isDone]);

  const onDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    ackSession(session.id, isDone ? 'done' : 'run');
  };

  return (
    <SidebarMenuSubItem>
      <div className="group/session relative flex w-full items-start gap-2.5 rounded-md py-1.5 pl-9 pr-6 hover:bg-sidebar-accent/50 transition-colors select-none">

        {/* Status Icon */}
        <div className={cn(
          "relative flex h-6 w-6 shrink-0 items-center justify-center rounded-md border shadow-sm transition-all mt-0.5",
          isDone ? "bg-emerald-500/15 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" :
            isOverdue ? "bg-orange-500/15 border-orange-500/20 text-orange-600 dark:text-orange-400" :
              isApproval ? "bg-amber-500/15 border-amber-500/20 text-amber-600 dark:text-amber-400" :
                "bg-blue-500/15 border-blue-500/20 text-blue-600 dark:text-blue-400"
        )}>
          {isDone ? <Check className="h-3.5 w-3.5" /> :
            isApproval ? (
              <>
                <div className="h-1.5 w-1.5 rounded-full bg-current animate-ping" />
                <div className="absolute h-1.5 w-1.5 rounded-full bg-current" />
              </>
            ) :
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          }
        </div>

        {/* Content */}
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs font-medium leading-snug text-foreground/90 break-words whitespace-normal">
            {session.title || "Thinking..."}
          </span>
          <span className={cn(
            "text-[10px] mt-0.5 font-normal",
            isOverdue && !isDone ? "text-orange-500/90" : "text-muted-foreground/80"
          )}>
            {isDone ? "Finished" :
              isApproval ? "Action Needed" :
                isOverdue ? "Taking longer than expected..." :
                  "Thinking..."}
          </span>
        </div>

        {/* Dismiss Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1.5 h-6 w-6 opacity-0 group-hover/session:opacity-100 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md"
          onClick={onDismiss}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </SidebarMenuSubItem>
  );
}

interface SidebarWorkspaceItemProps {
  path: string;
  name: string;
  icon: React.ElementType;
  variant?: "default" | "root";
  sessions?: import("@/services/session-rpc").SessionSummary[];
}

function SidebarWorkspaceItem({ path, name, icon: Icon, variant = "default", sessions = [] }: SidebarWorkspaceItemProps) {
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

      {/* Render sessions for this workspace */}
      {sessions.map(s => (
        <SidebarSessionItem key={s.id} session={s} />
      ))}

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
  const { sessions, startPolling, stopPolling } = useSessionStore();
  const [showMcpBanner, setShowMcpBanner] = useState(() => {
    return localStorage.getItem("galactic-hide-mcp-banner") !== "true";
  });

  const dismissMcpBanner = () => {
    setShowMcpBanner(false);
    localStorage.setItem("galactic-hide-mcp-banner", "true");
  };

  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  // Helper: Get sessions for a specific path
  const normalize = (p: string) => p.replace(/\/+$/, "").toLowerCase();

  const getSessionsForPath = (path: string) => {
    if (!path) return [];
    const normPath = normalize(path);
    const pathSessions = sessions.filter(s => s.workspace_path && normalize(s.workspace_path) === normPath);

    // Deduplicate by chat_id, keeping the latest one
    const latestSessionsMap = new Map<string, import("@/services/session-rpc").SessionSummary>();
    const sessionsWithoutChatId: import("@/services/session-rpc").SessionSummary[] = [];

    for (const s of pathSessions) {
      if (!s.chat_id) {
        sessionsWithoutChatId.push(s);
        continue;
      }

      const existing = latestSessionsMap.get(s.chat_id);
      if (!existing) {
        latestSessionsMap.set(s.chat_id, s);
      } else {
        // Compare timestamps to keep the newer one
        const tExisting = existing.started_at || '';
        const tCurrent = s.started_at || '';
        if (tCurrent >= tExisting) {
          latestSessionsMap.set(s.chat_id, s);
        }
      }
    }

    return [...sessionsWithoutChatId, ...latestSessionsMap.values()];
  };

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
                  <Collapsible key={project.id} defaultOpen={true} className="group/collapsible" asChild>
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
                            sessions={getSessionsForPath(project.path)}
                          />

                          {/* Active Workspaces */}
                          {project.workspaces?.map((ws) => (
                            <SidebarWorkspaceItem
                              key={ws.workspace}
                              path={ws.workspace}
                              name={ws.name}
                              icon={GitBranch}
                              sessions={getSessionsForPath(ws.workspace)}
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

        {showMcpBanner && (
          <SidebarGroup className="mt-auto px-2">
            <SidebarGroupContent>
              {open ? (
                <div className="relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-violet-950/30 via-slate-950/50 to-slate-950/80 text-white shadow-sm">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.25),transparent_45%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,hsl(var(--primary)/0.15),transparent_40%)]" />

                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 z-10 h-6 w-6 text-white/40 hover:text-white hover:bg-white/10"
                    onClick={dismissMcpBanner}
                  >
                    <X className="h-4 w-4" />
                  </Button>

                  <div className="relative flex flex-col gap-3 p-3">
                    <div className="flex items-start gap-3">
                      <div className="space-y-1 pr-6">
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
        )}
      </SidebarContent>
    </Sidebar>
  );
}
