import { CheckCircle2 } from "lucide-react";

import cursorIcon from "@/assets/cursor.jpeg";
import vscodeIcon from "@/assets/vscode-icon.png";
import { SettingsSection } from "@/components/Settings/SettingsSection";
import { SettingsStatusBadge } from "@/components/Settings/SettingsStatusBadge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type { EditorInstallState } from "@/hooks/use-settings-editor-preference";
import type { EditorName } from "@/services/editor";

interface PreferredEditorSettingsProps {
  installed: EditorInstallState;
  onEditorChange: (value: string) => void;
  preferredEditor: EditorName;
}

const editorOptions = [
  {
    description: "AI-native editor from the Cursor team.",
    icon: cursorIcon,
    title: "Cursor",
    value: "Cursor",
  },
  {
    description: "The classic Microsoft IDE.",
    icon: vscodeIcon,
    title: "Visual Studio Code",
    value: "VSCode",
  },
] as const;

export function PreferredEditorSettings({
  installed,
  onEditorChange,
  preferredEditor,
}: PreferredEditorSettingsProps) {
  return (
    <SettingsSection
      id="preferred-editor"
      title="Preferred Editor"
      description="Choose the editor Galactic opens from projects, workspaces, and the Quick Launcher."
    >
      <RadioGroup value={preferredEditor} onValueChange={onEditorChange} className="grid">
        {editorOptions.map((option) => {
          const isActive = preferredEditor === option.value;
          const isInstalled = installed[option.value];

          return (
            <Label
              key={option.value}
              htmlFor={`editor-${option.value}`}
              className={cn(
                "flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50",
                !isInstalled && "cursor-not-allowed opacity-60",
              )}
            >
              <RadioGroupItem
                value={option.value}
                id={`editor-${option.value}`}
                disabled={!isInstalled}
                className="sr-only"
              />
              <img src={option.icon} alt="" className="h-8 w-8 rounded-md border bg-muted object-contain p-1" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{option.title}</p>
                <p className="truncate text-xs text-muted-foreground">{option.description}</p>
              </div>
              <SettingsStatusBadge tone={isInstalled ? "success" : "muted"}>
                {isInstalled ? "Installed" : "Not found"}
              </SettingsStatusBadge>
              {isActive && <CheckCircle2 className="h-4 w-4 text-primary" />}
            </Label>
          );
        })}
      </RadioGroup>
    </SettingsSection>
  );
}
