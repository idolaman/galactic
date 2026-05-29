import { Rocket } from "lucide-react";

import { Button } from "@/components/ui/button";
import Logo from "@/assets/logo.svg";

interface GitHubAuthProps {
  onAuthSuccess: (user: { name: string; avatar: string }) => void;
}

export const GitHubAuth = ({ onAuthSuccess }: GitHubAuthProps) => {
  const handleEnterGalactic = () => {
    setTimeout(() => {
      onAuthSuccess({
        name: "Developer",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=developer"
      });
    }, 1000);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-md border bg-card p-6 shadow-sm">
        <div className="grid gap-6 text-center">
          <div className="flex justify-center">
            <img src={Logo} alt="Galactic Logo" className="h-14 w-14 rounded-md" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">Galactic</h1>
            <p className="text-sm text-muted-foreground">
              Code at Warp Speed
            </p>
          </div>
          <Button onClick={handleEnterGalactic} className="w-full" size="lg">
            <Rocket className="h-4 w-4" />
            Enter Galactic
          </Button>
          <p className="text-xs text-muted-foreground">
            Early Access Preview
          </p>
        </div>
      </div>
    </div>
  );
};
