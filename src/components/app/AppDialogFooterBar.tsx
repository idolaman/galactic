import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface AppDialogFooterBarProps {
  children: ReactNode;
  className?: string;
  leading?: ReactNode;
}

export function AppDialogFooterBar({
  children,
  className,
  leading,
}: AppDialogFooterBarProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col-reverse gap-3 border-t bg-muted/20 px-5 py-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      {leading ? <div className="min-h-9">{leading}</div> : null}
      <div className="flex min-w-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {children}
      </div>
    </div>
  );
}
