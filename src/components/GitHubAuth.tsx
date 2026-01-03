import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Rocket } from "lucide-react";
import Logo from "@/assets/logo.svg";

interface GitHubAuthProps {
  onAuthSuccess: (user: { name: string; avatar: string }) => void;
}

export const GitHubAuth = ({ onAuthSuccess }: GitHubAuthProps) => {
  const handleGitHubLogin = () => {
    // Mock GitHub auth for now
    setTimeout(() => {
      onAuthSuccess({
        name: "Developer",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=developer"
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-transparent relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[100px] opacity-50 animate-pulse" />
      </div>

      <Card className="w-full max-w-md p-8 bg-card/50 backdrop-blur-xl border-white/10 shadow-2xl relative z-10">
        <div className="text-center space-y-6">
          <div className="flex justify-center mb-4">
            <img src={Logo} alt="Galactic Logo" className="w-20 h-20" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-indigo-300 bg-clip-text text-transparent">
              Galactic
            </h1>
            <p className="text-muted-foreground text-lg">
              Code at Warp Speed
            </p>
          </div>

          <Button
            onClick={handleGitHubLogin}
            className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white border-0 h-12 text-lg shadow-lg hover:shadow-violet-500/25 transition-all duration-300"
            size="lg"
          >
            <Rocket className="mr-2 h-5 w-5" />
            Enter Galactic
          </Button>

          <p className="text-xs text-muted-foreground/60">
            Early Access Preview
          </p>
        </div>
      </Card>
    </div>
  );
};
