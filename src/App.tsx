import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthSignIn } from "@/components/AuthSignIn";
import { Header } from "@/components/Header";
import { WorkspaceConsoleProvider } from "@/components/WorkspaceConsole/WorkspaceConsoleProvider";
import { WorkspaceConsoleProjectsLayout } from "@/components/WorkspaceConsole/WorkspaceConsoleProjectsLayout";
import Index from "./pages/Index";
import { QuickSidebar } from "@/pages/QuickSidebar";
import Environments from "./pages/Environments";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { useUpdateListener } from "@/hooks/use-update";
import { ThemeProvider } from "@/components/theme-provider";
import { EnvironmentProvider } from "@/hooks/use-environment-manager";
import { WorkspaceIsolationManagerProvider } from "@/providers/WorkspaceIsolationManagerProvider";
import { StarsBackground } from "@/components/StarsBackground";
import { AuthProvider } from "@/providers/AuthProvider";
import { useAuth } from "@/hooks/use-auth";
import { GLOBAL_LOCAL_STORAGE_KEYS } from "@/services/local-storage-keys";

const queryClient = new QueryClient();

const MainApp = () => {
  const { signOut, status, user } = useAuth();

  if (status !== "authenticated" || !user) {
    return <AuthSignIn />;
  }

  return (
    <EnvironmentProvider key={user.id}>
      <WorkspaceIsolationManagerProvider>
        <HashRouter>
          <WorkspaceConsoleProvider>
            <SidebarProvider defaultOpen>
              <div className="flex h-svh w-full overflow-hidden bg-transparent">
                <AppSidebar />
                <SidebarInset className="h-svh min-h-0 overflow-hidden">
                  <Header user={user} onLogout={() => void signOut()} />
                  <WorkspaceConsoleProjectsLayout>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/environments" element={<Environments />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </WorkspaceConsoleProjectsLayout>
                </SidebarInset>
              </div>
            </SidebarProvider>
          </WorkspaceConsoleProvider>
        </HashRouter>
      </WorkspaceIsolationManagerProvider>
    </EnvironmentProvider>
  );
};

const QuickSidebarApp = () => {
  const { status, user } = useAuth();

  if (status !== "authenticated" || !user) {
    return <AuthSignIn />;
  }

  return (
    <EnvironmentProvider key={user.id}>
      <HashRouter>
        <Routes>
          <Route path="/quick-sidebar" element={<QuickSidebar />} />
          <Route path="*" element={<QuickSidebar />} />
        </Routes>
      </HashRouter>
    </EnvironmentProvider>
  );
};

const App = () => {
  const isQuickSidebar = typeof window !== "undefined" && window.location.hash.includes("quick-sidebar");
  useUpdateListener();

  const toastLayers = isQuickSidebar ? null : (
    <>
      <Toaster />
      <Sonner />
    </>
  );

  const content = isQuickSidebar ? (
    <QuickSidebarApp />
  ) : (
    <MainApp />
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" storageKey={GLOBAL_LOCAL_STORAGE_KEYS.theme}>
        <StarsBackground />
        <AuthProvider>
          <TooltipProvider>
            {toastLayers}
            {content}
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
