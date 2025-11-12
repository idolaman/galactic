import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { GitHubAuth } from "@/components/GitHubAuth";
import { Header } from "@/components/Header";
import Index from "./pages/Index";
import Environments from "./pages/Environments";
import Settings from "./pages/Settings";
import CodingAgents from "./pages/CodingAgents";
import NotFound from "./pages/NotFound";
import { useToast } from "@/hooks/use-toast";

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

  if (!user) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <GitHubAuth onAuthSuccess={handleAuthSuccess} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1 overflow-hidden">
                <Header user={user} onLogout={handleLogout} />
                <div className="flex-1 flex flex-col">
                  <header className="h-12 flex items-center border-b border-border px-4">
                    <SidebarTrigger />
                  </header>
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
            </div>
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
