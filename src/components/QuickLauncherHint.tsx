import { Keyboard } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";

interface QuickLauncherHintProps {
  className?: string;
}

export function QuickLauncherHint({ className }: QuickLauncherHintProps) {
  return (
    <NavLink
      to="/settings#global-hotkey"
      className={cn(
        "flex w-full items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent/35 px-2 py-1.5 text-left text-sidebar-foreground transition hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-0",
        className
      )}
    >
      <div className="flex h-6 w-6 items-center justify-center rounded border border-sidebar-border bg-sidebar text-muted-foreground">
        <Keyboard className="h-3.5 w-3.5" />
      </div>
      <div className="flex min-w-0 flex-col">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold leading-tight">Quick Launcher</span>
          <span className="rounded border border-sidebar-border bg-sidebar px-1.5 py-px text-[10px] font-medium text-muted-foreground">
            ⌘⇧G
          </span>
        </div>
        <span className="text-[10px] leading-tight text-muted-foreground">Configure in Settings</span>
      </div>
    </NavLink>
  );
}
