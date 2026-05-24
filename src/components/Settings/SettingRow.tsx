import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

interface SettingRowProps {
  children?: ReactNode;
  description?: ReactNode;
  htmlFor?: string;
  label: string;
}

export function SettingRow({ children, description, htmlFor, label }: SettingRowProps) {
  return (
    <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <Label htmlFor={htmlFor} className="text-sm font-medium">{label}</Label>
        {description && (
          <div className="text-xs leading-relaxed text-muted-foreground">{description}</div>
        )}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}
