import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { LogOut, Code2 } from "lucide-react";
import { ModeToggle } from "@/components/ModeToggle";

interface HeaderProps {
  user: {
    name: string;
    avatar: string;
  };
  onLogout: () => void;
}

export const Header = ({ user, onLogout }: HeaderProps) => (
  <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div className="flex h-16 items-center gap-3 px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-3 hidden h-6 md:block" />
      <div className="flex flex-1 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Code2 className="h-6 w-6 text-primary" />
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Galactic</p>
            <h1 className="text-lg font-semibold leading-tight">Project Control Center</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <div className="flex items-center gap-3 rounded-full border border-border/70 bg-background/60 px-3 py-1">
            <Avatar className="h-8 w-8 border border-border">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium hidden sm:block">{user.name}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onLogout} className="hover:bg-destructive/10 hover:text-destructive">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  </header>
);
