import { useEffect } from "react";

export function QuickSidebarAuthLoading() {
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
    <div
      className="h-screen w-full bg-background"
      role="status"
    >
      <span className="sr-only">Loading Quick Launcher</span>
    </div>
  );
}
