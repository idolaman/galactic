import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Github } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md p-8 bg-gradient-card border-border shadow-card">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Git IDE Manager
            </h1>
            <p className="text-muted-foreground">
              Manage your projects with worktree workflows
            </p>
          </div>
          
          <Button
            onClick={handleGitHubLogin}
            className="w-full bg-primary hover:bg-primary-glow transition-all duration-300 shadow-glow hover:shadow-[0_0_50px_hsl(199_89%_48%/0.3)]"
            size="lg"
          >
            <Github className="mr-2 h-5 w-5" />
            Sign in with GitHub
          </Button>
          
          <p className="text-xs text-muted-foreground">
            Secure authentication via GitHub OAuth
          </p>
        </div>
      </Card>
    </div>
  );
};
