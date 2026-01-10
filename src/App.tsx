import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { GitHubAuth } from "@/components/GitHubAuth";
import { Header } from "@/components/Header";
import { ExpiredApp } from "@/components/ExpiredApp";
import Index from "./pages/Index";
import { QuickSidebar } from "@/pages/QuickSidebar";
import Environments from "./pages/Environments";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { useToast } from "@/hooks/use-toast";
import { useUpdateListener } from "@/hooks/use-update";
import { useTimebomb } from "@/hooks/use-timebomb";
import { ThemeProvider } from "@/components/theme-provider";
import { EnvironmentProvider } from "@/hooks/use-environment-manager";
import { StarsBackground } from "@/components/StarsBackground";

const queryClient = new QueryClient();

interface User {
  name: string;
  avatar: string;
}

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const isQuickSidebar = typeof window !== "undefined" && window.location.hash.includes("quick-sidebar");
  const { status: timebombStatus, isLoading: isTimebombLoading, isBlocked } = useTimebomb();

  // Subscribe to update events and show toasts at app level
  useUpdateListener();

  const handleAuthSuccess = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const toastLayers = isQuickSidebar ? null : (
    <>
      <Toaster />
      <Sonner />
    </>
  );

  if (isTimebombLoading) {
    return null;
  }

  if (isBlocked && timebombStatus) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark" storageKey="galactic-ide-theme">
        <StarsBackground />
        <ExpiredApp
          isKilled={timebombStatus.isKilled}
          expirationDate={timebombStatus.expirationDate}
        />
      </ThemeProvider>
    );
  }

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
      <SidebarProvider defaultOpen>
        <div className="flex h-svh w-full bg-transparent">
          <AppSidebar />
          <SidebarInset>
            <Header user={user} onLogout={handleLogout} />
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-auto">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/environments" element={<Environments />} />
                  <Route path="/settings" element={<Settings />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </HashRouter>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" storageKey="galactic-ide-theme">
        <StarsBackground />
        <EnvironmentProvider>
          <TooltipProvider>
            {toastLayers}
            {content}
          </TooltipProvider>
        </EnvironmentProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
