import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

import { cn } from "@/lib/utils";

type AppDialogNoticeTone = "default" | "success" | "warning" | "destructive";

interface AppDialogNoticeProps {
  children: ReactNode;
  className?: string;
  tone?: AppDialogNoticeTone;
}

const toneClassNames: Record<AppDialogNoticeTone, string> = {
  default: "border-border bg-muted/30 text-muted-foreground",
  destructive: "border-destructive/30 bg-destructive/10 text-destructive",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
};

const toneIcons = {
  default: Info,
  destructive: AlertTriangle,
  success: CheckCircle2,
  warning: AlertTriangle,
} as const;

export function AppDialogNotice({
  children,
  className,
  tone = "default",
}: AppDialogNoticeProps) {
  const Icon = toneIcons[tone];

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md border px-3 py-2 text-xs",
        toneClassNames[tone],
        className,
      )}
    >
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
