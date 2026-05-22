import { useState } from "react";
import { Rocket, X } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { SidebarGroup, SidebarGroupContent } from "@/components/ui/sidebar";

export interface McpInstallBannerProps {
  open: boolean;
}

export function McpInstallBanner({ open }: McpInstallBannerProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) {
    return null;
  }

  return (
    <SidebarGroup className="mt-auto px-2">
      <SidebarGroupContent>
        {open ? (
          <div className="relative overflow-hidden rounded-md border border-sidebar-border bg-sidebar-accent/50 text-sidebar-foreground">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-10 h-6 w-6 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={() => setVisible(false)}
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="relative flex flex-col gap-3 p-3">
              <div className="flex items-start gap-3">
                <div className="space-y-1 pr-6">
                  <p className="text-sm font-semibold leading-tight">Install Galactic MCP</p>
                  <p className="text-xs text-muted-foreground">
                    Monitor AI agent statuses automatically with the Galactic MCP
                    running beside your workspace.
                  </p>
                </div>
              </div>
              <NavLink to="/settings#mcp-installation" className="w-full">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-sidebar-border bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent"
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
  );
}
