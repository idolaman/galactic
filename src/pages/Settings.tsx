import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import vscodeIcon from "@/assets/vscode-icon.png";
import cursorIcon from "@/assets/cursor.jpeg";
import { type EditorName } from "@/services/editor";
import { cn } from "@/lib/utils";

export default function Settings() {
  const { toast } = useToast();
  const [preferredEditor, setPreferredEditor] = useState<EditorName>(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("preferredEditor") : null;
    return (saved === "Cursor" || saved === "VSCode") ? saved : "Cursor";
  });
  const [cursorInstalled, setCursorInstalled] = useState<boolean>(false);
  const [vscodeInstalled, setVscodeInstalled] = useState<boolean>(false);

  useEffect(() => {
    window.localStorage.setItem("preferredEditor", preferredEditor);
  }, [preferredEditor]);

  const checkEditors = useCallback(async () => {
    if (window.electronAPI?.checkEditorInstalled) {
      const cursorCheck = await window.electronAPI.checkEditorInstalled("Cursor");
      const vscodeCheck = await window.electronAPI.checkEditorInstalled("VSCode");
      setCursorInstalled(cursorCheck);
      setVscodeInstalled(vscodeCheck);
    }
  }, []);

  useEffect(() => {
    checkEditors();
  }, [checkEditors]);

  const handleEditorChange = (value: string) => {
    const nextValue: EditorName = value === "VSCode" ? "VSCode" : "Cursor";
    setPreferredEditor(nextValue);
    toast({ title: "Default editor updated", description: `${nextValue} selected.` });
  };

  const editorOptions = [
    {
      value: "Cursor",
      title: "Cursor",
      description: "AI-native editor from the Cursor team.",
      icon: cursorIcon,
      installed: cursorInstalled,
    },
    {
      value: "VSCode",
      title: "Visual Studio Code",
      description: "The classic Microsoft IDE.",
      icon: vscodeIcon,
      installed: vscodeInstalled,
    },
  ] as const;

  return (
    <div className="space-y-8 p-6">
      <div>
        <p className="text-sm text-muted-foreground">Tweak how Galactic integrates with your native tooling.</p>
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <CardTitle>Preferred Editor</CardTitle>
          <CardDescription>Pick the editor to open projects from the sidebar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup
            value={preferredEditor}
            onValueChange={handleEditorChange}
            className="grid gap-4 md:grid-cols-2"
          >
            {editorOptions.map((option) => {
              const isActive = preferredEditor === option.value;
              const isDisabled = !option.installed;

              return (
                <Label
                  key={option.value}
                  htmlFor={`editor-${option.value}`}
                  className={cn(
                    "group relative flex cursor-pointer flex-col gap-4 rounded-xl border bg-background/70 p-4 transition-all",
                    isActive && "border-primary/70 ring-2 ring-primary/20 shadow-glow",
                    isDisabled && "cursor-not-allowed opacity-60",
                  )}
                >
                  <RadioGroupItem
                    value={option.value}
                    id={`editor-${option.value}`}
                    disabled={isDisabled}
                    className="sr-only"
                  />
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-card shadow-sm">
                        <img src={option.icon} alt={option.title} className="h-7 w-7 object-contain" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{option.title}</p>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                    </div>
                    <Badge variant={option.installed ? "secondary" : "outline"} className="uppercase tracking-wide">
                      {option.installed ? "Installed" : "Not found"}
                    </Badge>
                  </div>
                  {isActive && <CheckCircle2 className="absolute right-4 top-4 h-4 w-4 text-primary" />}
                </Label>
              );
            })}
          </RadioGroup>

        </CardContent>
      </Card>
    </div>
  );
}
