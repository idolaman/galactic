import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SettingsSectionProps {
  children: ReactNode;
  className?: string;
  description?: string;
  id: string;
  title: string;
}

export function SettingsSection({
  children,
  className,
  description,
  id,
  title,
}: SettingsSectionProps) {
  return (
    <section
      id={id}
      className={cn("rounded-md border bg-card text-card-foreground", className)}
    >
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="divide-y">{children}</div>
    </section>
  );
}
