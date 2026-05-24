import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SettingsStatusTone = "default" | "success" | "warning" | "muted";

interface SettingsStatusBadgeProps {
  children: string;
  tone?: SettingsStatusTone;
}

const toneClassNames: Record<SettingsStatusTone, string> = {
  default: "border-primary/20 bg-primary/10 text-primary",
  muted: "border-border bg-muted text-muted-foreground",
  success: "border-success/20 bg-success/10 text-success",
  warning: "border-warning/20 bg-warning/10 text-warning",
};

export function SettingsStatusBadge({
  children,
  tone = "default",
}: SettingsStatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn("h-5 rounded px-1.5 text-[10px]", toneClassNames[tone])}>
      {children}
    </Badge>
  );
}
