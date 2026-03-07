import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HookPlatformCard } from "@/components/settings/HookPlatformCard";
import { hookPlatformOptions } from "@/services/hook-platforms";
import type { HookPlatform, HookPlatformStatus } from "@/types/hooks";

interface HookInstallationSectionProps {
  installPlatform: (platform: HookPlatform) => void;
  installing: Partial<Record<HookPlatform, boolean>>;
  statuses: Partial<Record<HookPlatform, HookPlatformStatus>>;
}

export function HookInstallationSection({
  installPlatform,
  installing,
  statuses,
}: HookInstallationSectionProps) {
  return (
    <Card className="border-border bg-card" id="hooks-installation">
      <CardHeader className="pb-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <CardTitle>Install Galactic Hooks</CardTitle>
            <Badge variant="secondary">Config-safe</Badge>
          </div>
          <CardDescription>
            Galactic installs its own assets in <code>~/.galactic</code> and only registers references, so your existing hooks and plugins stay in place.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        {hookPlatformOptions.map((platform) => (
          <HookPlatformCard
            key={platform.id}
            description={platform.description}
            icon={platform.icon}
            installing={Boolean(installing[platform.id])}
            onInstall={() => installPlatform(platform.id)}
            status={statuses[platform.id]}
            title={platform.title}
          />
        ))}
      </CardContent>
    </Card>
  );
}
