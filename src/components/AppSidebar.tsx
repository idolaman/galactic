import { FolderGit2, Settings2, Settings as SettingsIcon, Rocket } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Projects", url: "/", icon: FolderGit2 },
  { title: "Environments", url: "/environments", icon: Settings2 },
  { title: "Settings", url: "/settings", icon: SettingsIcon },
];

export function AppSidebar() {
  const { open } = useSidebar();

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

        <SidebarGroup className="mt-4 px-2">
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

        {/* No footer gap – Settings is now a normal nav item above */}
      </SidebarContent>
      {/* Settings handled as a dedicated page now */}
    </Sidebar>
  );
}
