import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { GitHubAuth } from "@/components/GitHubAuth";
import { Header } from "@/components/Header";
import Index from "./pages/Index";
import Environments from "./pages/Environments";
import Settings from "./pages/Settings";
import CodingAgents from "./pages/CodingAgents";
import NotFound from "./pages/NotFound";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();

  const handleAuthSuccess = (userData: User) => {
    setUser(userData);
    toast({
      title: "Welcome back!",
      description: "Successfully signed in with GitHub",
    });
  };

  const handleLogout = () => {
    setUser(null);
    toast({
      title: "Signed out",
      description: "You've been logged out successfully",
    });
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" storageKey="galactic-ide-theme">
        <StarsBackground />
        <EnvironmentProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {!user ? (
              <GitHubAuth onAuthSuccess={handleAuthSuccess} />
            ) : (
              <BrowserRouter>
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
                            <Route path="/agents" element={<CodingAgents />} />
                            <Route path="/settings" element={<Settings />} />
                            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </div>
                      </div>
                    </SidebarInset>
                  </div>
                </SidebarProvider>
              </BrowserRouter>
            )}
          </TooltipProvider>
        </EnvironmentProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
