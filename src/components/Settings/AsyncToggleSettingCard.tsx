import { useEffect, useState, type ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAppToast } from "@/hooks/use-app-toast";
import {
  loadAsyncToggleSettingValue,
  saveAsyncToggleSettingValue,
  type ToggleSettingResult,
} from "@/lib/async-toggle-setting";
import { cn } from "@/lib/utils";

interface AsyncToggleSettingCardProps {
  cardId?: string;
  description: string;
  details: ReactNode;
  getValue?: () => Promise<boolean>;
  label: string;
  loadErrorDescription: string;
  loadErrorTitle: string;
  saveErrorDescription: string;
  saveErrorTitle: string;
  setValue?: (enabled: boolean) => Promise<ToggleSettingResult>;
  switchClassName?: string;
  switchId: string;
  title: string;
}

export function AsyncToggleSettingCard({
  cardId,
  description,
  details,
  getValue,
  label,
  loadErrorDescription,
  loadErrorTitle,
  saveErrorDescription,
  saveErrorTitle,
  setValue,
  switchClassName,
  switchId,
  title,
}: AsyncToggleSettingCardProps) {
  const { error: showError } = useAppToast();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadValue = async () =>
      loadAsyncToggleSettingValue({
        getValue,
        isMounted: () => isMounted,
        onError: () => showError({ title: loadErrorTitle, description: loadErrorDescription }),
        onLoaded: setEnabled,
        onSettled: () => setLoading(false),
      });

    void loadValue();
    return () => {
      isMounted = false;
    };
  }, [getValue, loadErrorDescription, loadErrorTitle, showError]);

  const handleCheckedChange = async (nextValue: boolean) => {
    if (!setValue) {
      setEnabled(nextValue);
      return;
    }

    const previousValue = enabled;
    setSaving(true);

    try {
      await saveAsyncToggleSettingValue({
        fallbackErrorMessage: saveErrorDescription,
        nextValue,
        onChanged: setEnabled,
        onError: (description) => showError({ title: saveErrorTitle, description }),
        previousValue,
        setValue,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-border bg-card" id={cardId}>
      <CardHeader className="pb-4">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Label htmlFor={switchId} className="text-sm font-medium">{label}</Label>
          <div className="text-xs text-muted-foreground">{details}</div>
        </div>
        <Switch
          id={switchId}
          checked={enabled}
          onCheckedChange={handleCheckedChange}
          disabled={loading || saving}
          className={cn(switchClassName)}
        />
      </CardContent>
    </Card>
  );
}
