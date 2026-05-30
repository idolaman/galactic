import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes } from "react-router-dom";

import { AppShell } from "@/components/app/AppShell";
import { AppToolbar } from "@/components/app/AppToolbar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthSignIn } from "@/components/AuthSignIn";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WorkspaceConsoleProvider } from "@/components/WorkspaceConsole/WorkspaceConsoleProvider";
import { WorkspaceConsoleProjectsLayout } from "@/components/WorkspaceConsole/WorkspaceConsoleProjectsLayout";
import { EnvironmentProvider } from "@/hooks/use-environment-manager";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateListener } from "@/hooks/use-update";
import Environments from "@/pages/Environments";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import { QuickSidebar } from "@/pages/QuickSidebar";
import Settings from "@/pages/Settings";
import { AuthProvider } from "@/providers/AuthProvider";
import { WorkspaceIsolationManagerProvider } from "@/providers/WorkspaceIsolationManagerProvider";
import { GLOBAL_LOCAL_STORAGE_KEYS } from "@/services/local-storage-keys";
import type { AuthUser } from "@/types/auth";

const queryClient = new QueryClient();

interface AuthenticatedAppProps {
  isQuickSidebar: boolean;
}

interface MainAppProps {
  onLogout: () => void;
  user: AuthUser;
}

const toToolbarUser = (user: AuthUser) => ({
  avatar: user.avatarUrl ?? "",
  name: user.name,
});

const MainApp = ({ user, onLogout }: MainAppProps) => (
  <HashRouter>
    <WorkspaceConsoleProvider>
      <AppShell
        sidebar={<AppSidebar />}
        toolbar={<AppToolbar user={toToolbarUser(user)} onLogout={onLogout} />}
      >
        <WorkspaceConsoleProjectsLayout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/environments" element={<Environments />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </WorkspaceConsoleProjectsLayout>
      </AppShell>
    </WorkspaceConsoleProvider>
  </HashRouter>
);

const QuickSidebarApp = () => (
  <HashRouter>
    <Routes>
      <Route path="/quick-sidebar" element={<QuickSidebar />} />
      <Route path="*" element={<QuickSidebar />} />
    </Routes>
  </HashRouter>
);

const AuthenticatedApp = ({ isQuickSidebar }: AuthenticatedAppProps) => {
  const { signOut, status, user } = useAuth();

  if (status !== "authenticated" || !user) {
    return <AuthSignIn />;
  }

  return (
    <EnvironmentProvider key={user.id}>
      <WorkspaceIsolationManagerProvider>
        {isQuickSidebar ? (
          <QuickSidebarApp />
        ) : (
          <MainApp user={user} onLogout={() => void signOut()} />
        )}
      </WorkspaceIsolationManagerProvider>
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

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" storageKey={GLOBAL_LOCAL_STORAGE_KEYS.theme}>
        <AuthProvider>
          <TooltipProvider>
            {toastLayers}
            <AuthenticatedApp isQuickSidebar={isQuickSidebar} />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
