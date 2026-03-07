import { CheckCircle2, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type { EditorName } from "@/services/editor";

interface EditorSettingsCardProps {
  installedEditors: Record<EditorName, boolean>;
  preferredEditor: EditorName;
  setPreferredEditor: (editor: EditorName) => void;
}

const editorOptions = [
  { value: "Cursor", title: "Cursor", description: "AI-native editor from the Cursor team." },
  { value: "VSCode", title: "Visual Studio Code", description: "The classic Microsoft editor." },
] as const;

export function EditorSettingsCard({
  installedEditors,
  preferredEditor,
  setPreferredEditor,
}: EditorSettingsCardProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <CardTitle>Preferred Editor</CardTitle>
        <CardDescription>Pick the editor Galactic should launch for workspaces.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          value={preferredEditor}
          onValueChange={(value) => setPreferredEditor(value === "VSCode" ? "VSCode" : "Cursor")}
          className="grid gap-4 md:grid-cols-2"
        >
          {editorOptions.map((option) => {
            const isActive = preferredEditor === option.value;
            const installed = installedEditors[option.value];
            return (
              <Label
                key={option.value}
                htmlFor={`editor-${option.value}`}
                className={cn(
                  "relative flex cursor-pointer flex-col gap-4 rounded-xl border bg-background/70 p-4 transition-all",
                  isActive && "border-primary/70 ring-2 ring-primary/20",
                  !installed && "cursor-not-allowed opacity-60",
                )}
              >
                <RadioGroupItem id={`editor-${option.value}`} value={option.value} disabled={!installed} className="sr-only" />
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">{option.title}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                  <Badge variant={installed ? "secondary" : "outline"}>{installed ? "Installed" : "Not found"}</Badge>
                </div>
                {isActive ? <CheckCircle2 className="absolute right-4 top-4 h-4 w-4 text-primary" /> : null}
              </Label>
            );
          })}
        </RadioGroup>

        <div className="flex items-start gap-3 rounded-lg border border-primary/10 bg-primary/5 p-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-xs leading-relaxed">
            Galactic detects installed editors from the main process and falls back safely when your preferred editor is unavailable.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
