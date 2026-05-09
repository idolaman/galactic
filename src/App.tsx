import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthSignIn } from "@/components/AuthSignIn";
import { Header } from "@/components/Header";
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
import { trackUserLoggedIn, trackUserLoggedOut } from "@/services/analytics";

const queryClient = new QueryClient();

const MainApp = () => {
  const { signOut, status, user } = useAuth();

  if (status !== "authenticated" || !user) {
    return <AuthSignIn />;
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

  return (
    <HashRouter>
      <SidebarProvider defaultOpen>
        <div className="flex h-svh w-full bg-transparent">
          <AppSidebar />
          <SidebarInset>
            <Header user={user} onLogout={() => void signOut()} />
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-auto">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/environments" element={<Environments />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </HashRouter>
  );
};

const QuickSidebarApp = () => (
  <HashRouter>
    <Routes>
      <Route path="/quick-sidebar" element={<QuickSidebar />} />
      <Route path="*" element={<QuickSidebar />} />
    </Routes>
  </HashRouter>
);

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
      <ThemeProvider attribute="class" defaultTheme="dark" storageKey="galactic-ide-theme">
        <StarsBackground />
        <EnvironmentProvider>
          <WorkspaceIsolationManagerProvider>
            <AuthProvider enabled={!isQuickSidebar}>
              <TooltipProvider>
                {toastLayers}
                {content}
              </TooltipProvider>
            </AuthProvider>
          </WorkspaceIsolationManagerProvider>
        </EnvironmentProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
