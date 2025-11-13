import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import vscodeIcon from "@/assets/vscode-icon.png";

export default function Settings() {
  const { toast } = useToast();
  const [preferredEditor, setPreferredEditor] = useState<"Cursor" | "VSCode">(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("preferredEditor") : null;
    return (saved === "Cursor" || saved === "VSCode") ? saved : "Cursor";
  });
  const [cursorSrc, setCursorSrc] = useState<string>("/cursor.jpeg");
  const [cursorInstalled, setCursorInstalled] = useState<boolean>(false);
  const [vscodeInstalled, setVscodeInstalled] = useState<boolean>(false);

  useEffect(() => {
    window.localStorage.setItem("preferredEditor", preferredEditor);
  }, [preferredEditor]);

  useEffect(() => {
    const checkEditors = async () => {
      if (window.electronAPI?.checkEditorInstalled) {
        const cursorCheck = await window.electronAPI.checkEditorInstalled("Cursor");
        const vscodeCheck = await window.electronAPI.checkEditorInstalled("VSCode");
        setCursorInstalled(cursorCheck);
        setVscodeInstalled(vscodeCheck);
      }
    };
    checkEditors();
  }, []);

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your application preferences.
          </p>
        </div>

        <div className="space-y-6">
          <Card className="p-6 bg-card border-border">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Platform</h2>
              <p className="text-xs text-muted-foreground">Choose your default editor from your Applications folder:</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setPreferredEditor("Cursor");
                  toast({ title: "Default editor updated", description: "Cursor selected." });
                }}
                disabled={!cursorInstalled}
                className={`group relative flex items-center justify-between gap-3 rounded-lg border px-3 py-3 transition-all text-left ${
                  preferredEditor === "Cursor"
                    ? "border-primary bg-primary/10 ring-1 ring-primary/40"
                    : cursorInstalled
                    ? "border-border hover:border-primary/40 hover:bg-muted/40"
                    : "border-border opacity-50 cursor-not-allowed"
                }`}
                aria-pressed={preferredEditor === "Cursor"}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-background border border-border shadow-sm overflow-hidden">
                    <img
                      src={cursorSrc}
                      alt="Cursor"
                      className="h-6 w-6 object-contain"
                    />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium">Cursor</div>
                    <div className="text-[11px] text-muted-foreground">
                      {cursorInstalled ? "Installed" : "Not Found"}
                    </div>
                  </div>
                </div>
                {preferredEditor === "Cursor" && <CheckCircle2 className="h-4 w-4 text-primary" />}
              </button>

              <button
                onClick={() => {
                  setPreferredEditor("VSCode");
                  toast({ title: "Default editor updated", description: "VSCode selected." });
                }}
                disabled={!vscodeInstalled}
                className={`group relative flex items-center justify-between gap-3 rounded-lg border px-3 py-3 transition-all text-left ${
                  preferredEditor === "VSCode"
                    ? "border-primary bg-primary/10 ring-1 ring-primary/40"
                    : vscodeInstalled
                    ? "border-border hover:border-primary/40 hover:bg-muted/40"
                    : "border-border opacity-50 cursor-not-allowed"
                }`}
                aria-pressed={preferredEditor === "VSCode"}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-background border border-border shadow-sm">
                    <img src={vscodeIcon} alt="VSCode" className="h-6 w-6 object-contain" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium">VSCode</div>
                    <div className="text-[11px] text-muted-foreground">
                      {vscodeInstalled ? "Installed" : "Not Found"}
                    </div>
                  </div>
                </div>
                {preferredEditor === "VSCode" && <CheckCircle2 className="h-4 w-4 text-primary" />}
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

