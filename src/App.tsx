import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes } from "react-router-dom";

import { AppShell } from "@/components/app/AppShell";
import { AppToolbar } from "@/components/app/AppToolbar";
import { AppSidebar } from "@/components/AppSidebar";
import { GitHubAuth } from "@/components/GitHubAuth";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WorkspaceConsoleProvider } from "@/components/WorkspaceConsole/WorkspaceConsoleProvider";
import { WorkspaceConsoleProjectsLayout } from "@/components/WorkspaceConsole/WorkspaceConsoleProjectsLayout";
import { EnvironmentProvider } from "@/hooks/use-environment-manager";
import { useUpdateListener } from "@/hooks/use-update";
import Environments from "@/pages/Environments";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import { QuickSidebar } from "@/pages/QuickSidebar";
import Settings from "@/pages/Settings";
import { WorkspaceIsolationManagerProvider } from "@/providers/WorkspaceIsolationManagerProvider";
import { trackUserLoggedIn, trackUserLoggedOut } from "@/services/analytics";

const queryClient = new QueryClient();

interface User {
  name: string;
  avatar: string;
}

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const isQuickSidebar = typeof window !== "undefined" && window.location.hash.includes("quick-sidebar");
  // Subscribe to update events and show toasts at app level
  useUpdateListener();

  const handleAuthSuccess = (userData: User) => {
    setUser(userData);
    trackUserLoggedIn();
  };

  const handleLogout = () => {
    trackUserLoggedOut();
    setUser(null);
  };

  const toastLayers = isQuickSidebar ? null : (
    <>
      <Toaster />
      <Sonner />
    </>
  );

  const content = isQuickSidebar ? (
    <HashRouter>
      <Routes>
        <Route path="/quick-sidebar" element={<QuickSidebar />} />
        <Route path="*" element={<QuickSidebar />} />
      </Routes>
    </HashRouter>
  ) : !user ? (
    <GitHubAuth onAuthSuccess={handleAuthSuccess} />
  ) : (
    <HashRouter>
      <WorkspaceConsoleProvider>
        <AppShell
          sidebar={<AppSidebar />}
          toolbar={<AppToolbar user={user} onLogout={handleLogout} />}
        >
          <WorkspaceConsoleProjectsLayout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/environments" element={<Environments />} />
              <Route path="/settings" element={<Settings />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </WorkspaceConsoleProjectsLayout>
        </AppShell>
      </WorkspaceConsoleProvider>
    </HashRouter>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" storageKey="galactic-ide-theme">
        <EnvironmentProvider>
          <WorkspaceIsolationManagerProvider>
            <TooltipProvider>
              {toastLayers}
              {content}
            </TooltipProvider>
          </WorkspaceIsolationManagerProvider>
        </EnvironmentProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
