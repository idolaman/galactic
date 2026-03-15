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

  return (
    <>
      <SidebarMenuSubItem>
        <SidebarMenuSubButton asChild className="group/item cursor-default pr-1">
          <div>
            <Icon
              className={cn(
                "h-4 w-4",
                variant === "root" ? "text-primary/70" : "text-muted-foreground",
              )}
            />
            <span className="flex-1 truncate">{name}</span>
            <WorkspaceRelaunchIndicator path={path} className="shrink-0" />
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover/item:opacity-100 hover:bg-background/50 hover:text-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
              onClick={() => launchWorkspace(path)}
            >
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>

      {sessions.length > 0 && (
        <>
          {sessions.map((session) => (
            <SidebarSessionItem key={session.id} session={session} />
          ))}
        </>
      )}
    </>
  );
}
