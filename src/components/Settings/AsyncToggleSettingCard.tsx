import { useEffect, useState, type ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAppToast } from "@/hooks/use-app-toast";
import { cn } from "@/lib/utils";

interface ToggleSettingResult {
  success: boolean;
  enabled: boolean;
  error?: string;
}

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
  const { error } = useAppToast();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadValue = async () => {
      if (!getValue) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        const nextValue = await getValue();
        if (isMounted) {
          setEnabled(nextValue);
        }
      } catch (error) {
        if (isMounted) {
          error({ title: loadErrorTitle, description: loadErrorDescription });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadValue();
    return () => {
      isMounted = false;
    };
  }, [error, getValue, loadErrorDescription, loadErrorTitle]);

  const handleCheckedChange = async (nextValue: boolean) => {
    if (!setValue) {
      setEnabled(nextValue);
      return;
    }

    const previousValue = enabled;
    setEnabled(nextValue);
    setSaving(true);

    try {
      const result = await setValue(nextValue);
      if (!result?.success) {
        setEnabled(result?.enabled ?? previousValue);
        error({ title: saveErrorTitle, description: result?.error ?? saveErrorDescription });
        return;
      }
      setEnabled(result.enabled);
    } catch (error) {
      setEnabled(previousValue);
      error({ title: saveErrorTitle, description: saveErrorDescription });
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
