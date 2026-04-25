import type { ElementType } from "react";
import { FolderGit2, Settings, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NavLink } from "@/components/NavLink";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface NavItem {
  icon: ElementType;
  title: string;
  url: string;
  deprecated?: boolean;
}

const navItems: NavItem[] = [
  { title: "Projects", url: "/", icon: FolderGit2 },
  { title: "Environments", url: "/environments", icon: Settings2, deprecated: true },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function SidebarNavigation() {
  const open = useSidebar().open;

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  end={item.url === "/"}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                  activeClassName="bg-muted font-medium text-foreground"
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {open && (
                    <div className="flex w-full items-center justify-between gap-2 overflow-hidden">
                      <span className="truncate">{item.title}</span>
                      {item.deprecated && (
                        <Badge
                          variant="outline"
                          className="h-[18px] px-1.5 text-[9px] uppercase tracking-wider text-muted-foreground opacity-70 shrink-0"
                        >
                          Deprecated
                        </Badge>
                      )}
                    </div>
                  )}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
