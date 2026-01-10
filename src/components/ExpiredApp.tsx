import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExpiredAppProps {
  isKilled: boolean;
  expirationDate: string | null;
}

export function ExpiredApp({ isKilled, expirationDate }: ExpiredAppProps) {
  const handleClose = () => {
    window.close();
  };

  const title = isKilled ? "App Unavailable" : "Alpha Version Expired";

  const message = isKilled
    ? "This version of the app has been disabled. Please download the latest version."
    : `This alpha version expired on ${expirationDate ?? "unknown date"}. Please download the latest version to continue.`;

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-background p-8">
      <AlertTriangle className="h-16 w-16 text-destructive" />
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      <p className="max-w-md text-center text-muted-foreground">{message}</p>
      <Button variant="secondary" onClick={handleClose}>
        Close App
      </Button>
    </div>
  );
}
