import { useEffect } from "react";
import { LockKeyhole } from "lucide-react";

export function QuickSidebarAuthRequired() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        window.electronAPI?.hideQuickSidebar?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background px-6 text-foreground">
      <div className="flex max-w-xs flex-col items-center gap-3 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted/40 text-muted-foreground">
          <LockKeyhole className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Sign in from Galactic to use Quick Launcher.</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Open the main Galactic window and sign in to access your projects and workspaces.
          </p>
        </div>
      </div>
    </div>
  );
}
