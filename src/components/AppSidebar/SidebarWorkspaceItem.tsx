import type { ElementType } from "react";
import { ExternalLink } from "lucide-react";
import { WorkspaceRelaunchIndicator } from "@/components/WorkspaceRelaunchIndicator";
import { Button } from "@/components/ui/button";
import {
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { useEditorLauncher } from "@/hooks/use-editor-launcher";
import { cn } from "@/lib/utils";
import type { SessionSummary } from "@/services/session-rpc";
import { SidebarSessionItem } from "@/components/AppSidebar/SidebarSessionItem";

const VISIBLE_SESSION_LIMIT = 2;

export interface SidebarWorkspaceItemProps {
  icon: ElementType;
  name: string;
  path: string;
  sessions: SessionSummary[];
  variant?: "default" | "root";
}

export function SidebarWorkspaceItem({
  icon: Icon,
  name,
  path,
  sessions,
  variant = "default",
}: SidebarWorkspaceItemProps) {
  const { launchWorkspace } = useEditorLauncher();
  const visibleSessions = sessions.slice(0, VISIBLE_SESSION_LIMIT);
  const hiddenSessionCount = Math.max(0, sessions.length - visibleSessions.length);

  return (
    <>
      <SidebarMenuSubItem>
        <SidebarMenuSubButton
          asChild
          className="group/item h-8 cursor-default rounded-md px-2 pr-1 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <div>
            <Icon
              className={cn(
                "h-3.5 w-3.5",
                variant === "root" ? "text-primary" : "text-muted-foreground",
              )}
            />
            <span className="flex-1 truncate">{name}</span>
            <WorkspaceRelaunchIndicator path={path} className="shrink-0" />
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 shrink-0 opacity-0 transition-opacity hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-0 focus-visible:ring-offset-0 group-hover/item:opacity-100"
              onClick={() => launchWorkspace(path)}
              aria-label={`Open ${name}`}
            >
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>

      {visibleSessions.length > 0 && (
        <>
          {visibleSessions.map((session) => (
            <SidebarSessionItem key={session.id} session={session} />
          ))}
          {hiddenSessionCount > 0 && (
            <SidebarMenuSubItem>
              <div className="pl-9 text-[10px] font-medium text-muted-foreground">
                +{hiddenSessionCount} sessions
              </div>
            </SidebarMenuSubItem>
          )}
        </>
      )}
    </>
  );
}
