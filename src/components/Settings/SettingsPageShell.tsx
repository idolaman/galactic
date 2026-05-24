import type { ReactNode } from "react";

import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";

interface SettingsPageShellProps {
  children: ReactNode;
}

const settingsSections = [
  { hash: "preferred-editor", label: "Editor" },
  { hash: "project-services-support", label: "Project Services" },
  { hash: "global-hotkey", label: "Quick Launcher" },
  { hash: "mcp-installation", label: "MCP" },
  { hash: "updates", label: "Updates" },
];

export function SettingsPageShell({ children }: SettingsPageShellProps) {
  return (
    <div className="min-h-full bg-background">
      <div className="border-b bg-background px-6 py-5">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure how Galactic connects to local tooling.
          </p>
        </div>
      </div>
      <div className="grid gap-6 p-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <nav className="flex gap-2 overflow-x-auto lg:sticky lg:top-16 lg:flex-col lg:self-start lg:overflow-visible">
          {settingsSections.map((section) => (
            <NavLink
              key={section.hash}
              to={`/settings#${section.hash}`}
              className={cn(
                "whitespace-nowrap rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors",
                "hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              {section.label}
            </NavLink>
          ))}
        </nav>
        <div className="grid max-w-4xl gap-4">{children}</div>
      </div>
    </div>
  );
}
