import type { ReactNode } from "react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export interface AppShellProps {
  children: ReactNode;
  sidebar: ReactNode;
  toolbar: ReactNode;
}

export function AppShell({ children, sidebar, toolbar }: AppShellProps) {
  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-svh w-full overflow-hidden bg-background text-foreground">
        {sidebar}
        <SidebarInset className="h-svh min-h-0 overflow-hidden bg-background">
          {toolbar}
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
