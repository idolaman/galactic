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
          <div className="relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-violet-950/30 via-slate-950/50 to-slate-950/80 text-white shadow-sm">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.25),transparent_45%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,hsl(var(--primary)/0.15),transparent_40%)]" />

            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-10 h-6 w-6 text-white/40 hover:bg-white/10 hover:text-white"
              onClick={() => setVisible(false)}
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="relative flex flex-col gap-3 p-3">
              <div className="flex items-start gap-3">
                <div className="space-y-1 pr-6">
                  <p className="text-sm font-semibold leading-tight">Install Galactic MCP</p>
                  <p className="text-xs text-white/80">
                    Monitor AI agent statuses automatically with the Galactic MCP
                    running beside your workspace.
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
  );
}
