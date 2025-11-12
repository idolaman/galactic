import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Code2 } from "lucide-react";
import vscodeIcon from "@/assets/vscode-icon.png";

interface Editor {
  name: string;
  installed: boolean;
  icon: string;
}

interface EditorSelectorProps {
  onSelect: (editor: string) => void;
  selectedEditor: string | null;
}

export const EditorSelector = ({ onSelect, selectedEditor }: EditorSelectorProps) => {
  const editors: Editor[] = [
    { name: "Cursor", installed: true, icon: "/cursor.jpeg" },
    { name: "VSCode", installed: false, icon: vscodeIcon }
  ];

  return (
    <Card className="p-6 bg-gradient-card border-border shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <Code2 className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Choose Your Editor</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {editors.map((editor) => (
          <button
            key={editor.name}
            onClick={() => editor.installed && onSelect(editor.name)}
            disabled={!editor.installed}
            className={`p-4 rounded-lg border transition-all duration-300 text-left ${
              selectedEditor === editor.name
                ? "border-primary bg-primary/5 shadow-glow"
                : editor.installed
                ? "border-border hover:border-primary/50 bg-secondary/50"
                : "border-border opacity-50 cursor-not-allowed"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <img src={editor.icon} alt={editor.name} className="w-12 h-12 object-contain" />
              {editor.installed ? (
                <CheckCircle2 className="h-5 w-5 text-success" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
            </div>
            
            <div className="space-y-1">
              <h3 className="font-semibold">{editor.name}</h3>
              <Badge 
                variant={editor.installed ? "default" : "destructive"}
                className={editor.installed ? "bg-success/20 text-success border-success/30" : ""}
              >
                {editor.installed ? "Installed" : "Not Found"}
              </Badge>
            </div>
          </button>
        ))}
      </div>
      
      {!selectedEditor && (
        <p className="text-sm text-muted-foreground mt-4">
          Select an installed editor to continue
        </p>
      )}
    </Card>
  );
};
