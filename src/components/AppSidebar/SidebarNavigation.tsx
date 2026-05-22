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
    <SidebarGroup className="px-2 py-1">
      <SidebarGroupContent>
        <SidebarMenu className="gap-0.5">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title} className="h-8 p-0">
                <NavLink
                  to={item.url}
                  end={item.url === "/"}
                  className="relative flex h-8 items-center gap-2.5 rounded-md px-2.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  activeClassName="bg-sidebar-accent font-medium text-sidebar-accent-foreground before:absolute before:left-0 before:top-1.5 before:h-5 before:w-0.5 before:rounded-r before:bg-primary"
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {open && (
                    <div className="flex w-full items-center justify-between gap-2 overflow-hidden">
                      <span className="truncate">{item.title}</span>
                      {item.deprecated && (
                        <Badge
                          variant="outline"
                          className="h-4 shrink-0 rounded px-1.5 text-[9px] font-medium uppercase tracking-wide text-muted-foreground"
                        >
                          Legacy
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
