import type { LucideIcon } from "lucide-react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { HookPlatformStatus } from "@/types/hooks";

interface HookPlatformCardProps {
  description: string;
  icon: LucideIcon;
  installing: boolean;
  onInstall: () => void;
  status?: HookPlatformStatus;
  title: string;
}

const getBadgeLabel = (status?: HookPlatformStatus) => {
  if (!status) return "Loading";
  if (!status.supported) return "Unavailable";
  if (status.installed) return "Installed";
  return status.mode === "manual" ? "Manual" : "Ready";
};

const getButtonLabel = (status?: HookPlatformStatus, installing = false) => {
  if (installing) return "Preparing...";
  if (!status) return "Checking...";
  if (status.installed) return "Installed";
  return status.mode === "manual" ? "Prepare assets" : "Install hooks";
};

export function HookPlatformCard({ description, icon: Icon, installing, onInstall, status, title }: HookPlatformCardProps) {
  return (
    <Card className="border bg-background/70 shadow-sm">
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/15 bg-primary/5">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <Badge variant={status?.installed ? "secondary" : "outline"}>{getBadgeLabel(status)}</Badge>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">{status?.summary ?? description}</p>
        </div>
        {status?.manualSteps?.length ? (
          <div className="space-y-1 rounded-lg border border-border/70 bg-muted/40 p-3 text-xs text-muted-foreground">
            {status.manualSteps.slice(0, 2).map((step) => <p key={step}>{step}</p>)}
          </div>
        ) : null}
        <Button onClick={onInstall} disabled={installing || status?.installed || status?.supported === false} className="mt-auto gap-2">
          {installing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {getButtonLabel(status, installing)}
        </Button>
      </CardContent>
    </Card>
  );
}
