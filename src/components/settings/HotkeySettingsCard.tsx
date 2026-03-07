import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface HotkeySettingsCardProps {
  enabled: boolean;
  highlight: boolean;
  loading: boolean;
  onChange: (enabled: boolean) => void;
  saving: boolean;
}

export function HotkeySettingsCard({ enabled, highlight, loading, onChange, saving }: HotkeySettingsCardProps) {
  return (
    <Card className="border-border bg-card" id="global-hotkey">
      <CardHeader className="pb-4">
        <CardTitle>Global Hotkey</CardTitle>
        <CardDescription>Enable the system shortcut to open the Quick Launcher.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Label htmlFor="quick-sidebar-hotkey" className="text-sm font-medium">Quick Launcher</Label>
          <p className="text-xs text-muted-foreground">
            Press <kbd className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">Cmd+Shift+G</kbd> to toggle the Quick Launcher.
          </p>
        </div>
        <Switch
          id="quick-sidebar-hotkey"
          checked={enabled}
          onCheckedChange={onChange}
          disabled={loading || saving}
          className={cn(highlight && "ring-2 ring-primary ring-offset-2 ring-offset-background")}
        />
      </CardContent>
    </Card>
  );
}
