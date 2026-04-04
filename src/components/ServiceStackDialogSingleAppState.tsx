import { AppWindow } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceStackDialogSingleAppStateProps {
  className?: string;
}

export const ServiceStackDialogSingleAppState = ({
  className,
}: ServiceStackDialogSingleAppStateProps) => (
  <div
    className={cn(
      "flex min-h-[16rem] flex-col items-center justify-center rounded-lg border border-dashed bg-muted/10 px-6 py-12 text-center",
      className,
    )}
  >
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
      <AppWindow className="h-6 w-6 text-primary" />
    </div>
    <h3 className="text-sm font-medium">Single Application</h3>
    <p className="mt-1 max-w-[20rem] text-xs text-muted-foreground">
      Galactic will route the workspace root as the app service and generate an
      app-prefixed domain automatically.
    </p>
  </div>
);
