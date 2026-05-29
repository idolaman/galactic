import { useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";

import Logo from "@/assets/logo.svg";
import { ModeToggle } from "@/components/ModeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface AppToolbarUser {
  avatar: string;
  name: string;
}

export interface AppToolbarProps {
  onLogout: () => void;
  user: AppToolbarUser;
}

const routeLabels: Record<string, string> = {
  "/": "Projects",
  "/environments": "Environments",
  "/settings": "Settings",
};

export function AppToolbar({ user, onLogout }: AppToolbarProps) {
  const location = useLocation();
  const routeLabel = routeLabels[location.pathname] ?? "Galactic";
  const fallback = user.name.trim().charAt(0).toUpperCase() || "G";

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 pt-[env(safe-area-inset-top)] supports-[backdrop-filter]:bg-background/85">
      <div className="flex h-12 items-center gap-3 px-3">
        <SidebarTrigger className="h-8 w-8" />
        <Separator orientation="vertical" className="hidden h-5 md:block" />

        <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <img src={Logo} alt="" className="h-6 w-6 shrink-0 rounded-md" aria-hidden="true" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight">Galactic</p>
              <p className="truncate text-xs leading-tight text-muted-foreground">{routeLabel}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <ModeToggle />
            <div className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1">
              <Avatar className="h-6 w-6 border border-border">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="text-[11px]">{fallback}</AvatarFallback>
              </Avatar>
              <span className="hidden max-w-36 truncate text-sm font-medium sm:block">
                {user.name}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onLogout}
              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
