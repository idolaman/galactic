import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import vscodeIcon from "@/assets/vscode-icon.png";
import cursorIcon from "@/assets/cursor.jpeg";
import { Button } from "@/components/ui/button";
import { type EditorName } from "@/services/editor";
import { cn } from "@/lib/utils";
import { projectStorage } from "@/services/projects";
import { markAllWorkspacesRequireRelaunch } from "@/services/workspace-state";

export default function Settings() {
  const { toast } = useToast();
  const [preferredEditor, setPreferredEditor] = useState<EditorName>(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("preferredEditor") : null;
    return (saved === "Cursor" || saved === "VSCode") ? saved : "Cursor";
  });
  const [cursorInstalled, setCursorInstalled] = useState<boolean>(false);
  const [vscodeInstalled, setVscodeInstalled] = useState<boolean>(false);

  const [mcpInstalled, setMcpInstalled] = useState<Record<string, boolean>>({
    Cursor: false,
    VSCode: false,
    Claude: false,
    Codex: false,
  });
  const [installing, setInstalling] = useState<Record<string, boolean>>({});

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

  const checkMcpStatus = useCallback(async () => {
    if (window.electronAPI?.checkMcpInstalled) {
      const tools = ["Cursor", "VSCode", "Claude", "Codex"];
      const status: Record<string, boolean> = {};

      for (const tool of tools) {
        status[tool] = await window.electronAPI.checkMcpInstalled(tool);
      }
      setMcpInstalled(status);
    }
  }, []);

  useEffect(() => {
    checkEditors();
    checkMcpStatus();
  }, [checkEditors, checkMcpStatus]);

  const handleEditorChange = (value: string) => {
    const nextValue: EditorName = value === "VSCode" ? "VSCode" : "Cursor";
    setPreferredEditor(nextValue);
    toast({ title: "Default editor updated", description: `${nextValue} selected.` });
  };

  const handleInstallMcp = async (tool: string) => {
    if (!window.electronAPI?.installMcp) return;

    setInstalling(prev => ({ ...prev, [tool]: true }));
    try {
      const result = await window.electronAPI.installMcp(tool);
      if (result.success) {
        toast({ title: "Installation Successful", description: `Galactic MCP installed for ${tool}.` });

        // Mark all workspaces for relaunch
        const projects = projectStorage.load();
        const allPaths: string[] = [];
        for (const p of projects) {
          allPaths.push(p.path);
          if (p.workspaces) {
            for (const ws of p.workspaces) {
              allPaths.push(ws.workspace);
            }
          }
        }
        markAllWorkspacesRequireRelaunch(allPaths);

        await checkMcpStatus();
      } else {
        toast({
          title: "Installation Failed",
          description: result.error || `Failed to install MCP for ${tool}.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setInstalling(prev => ({ ...prev, [tool]: false }));
    }
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

      <Card className="border-border bg-card" id="mcp-installation">
        <CardHeader className="pb-4">
          <CardTitle>Install Galactic MCP</CardTitle>
          <CardDescription>Connect your favorite tools to Galactic to monitor AI agent statuses.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="flex flex-col items-center justify-between gap-4 border bg-background/70 p-6 text-center shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#007acc]/10 text-[#007acc] shadow-sm ring-1 ring-[#007acc]/20">
              <img src={vscodeIcon} alt="VSCode" className="h-8 w-8 object-contain" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold">VS Code</p>
              <p className="text-xs text-muted-foreground">The classic editor</p>
            </div>
            <Button
              variant={mcpInstalled["VSCode"] ? "outline" : "secondary"}
              className="w-full"
              disabled={mcpInstalled["VSCode"] || installing["VSCode"]}
              onClick={() => handleInstallMcp("VSCode")}
            >
              {mcpInstalled["VSCode"] ? "Installed" : installing["VSCode"] ? "Installing..." : "Install"}
            </Button>
          </Card>

          <Card className="flex flex-col items-center justify-between gap-4 border bg-background/70 p-6 text-center shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black p-1 shadow-sm">
              <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="h-10 w-10">
                <g clipPath="url(#prefix__clip0_5_17)">
                  <rect width="512" height="512" rx="122" fill="#000" />
                  <g clipPath="url(#prefix__clip1_5_17)">
                    <mask id="prefix__a" style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="85" y="89" width="343" height="334">
                      <path d="M85 89h343v334H85V89z" fill="#fff" />
                    </mask>
                    <g mask="url(#prefix__a)">
                      <path d="M255.428 423l148.991-83.5L255.428 256l-148.99 83.5 148.99 83.5z" fill="url(#prefix__paint0_linear_5_17)" />
                      <path d="M404.419 339.5v-167L255.428 89v167l148.991 83.5z" fill="url(#prefix__paint1_linear_5_17)" />
                      <path d="M255.428 89l-148.99 83.5v167l148.99-83.5V89z" fill="url(#prefix__paint2_linear_5_17)" />
                      <path d="M404.419 172.5L255.428 423V256l148.991-83.5z" fill="#E4E4E4" />
                      <path d="M404.419 172.5L255.428 256l-148.99-83.5h297.981z" fill="#fff" />
                    </g>
                  </g>
                </g>
                <defs>
                  <linearGradient id="prefix__paint0_linear_5_17" x1="255.428" y1="256" x2="255.428" y2="423" gradientUnits="userSpaceOnUse">
                    <stop offset=".16" stopColor="#fff" stopOpacity=".39" />
                    <stop offset=".658" stopColor="#fff" stopOpacity=".8" />
                  </linearGradient>
                  <linearGradient id="prefix__paint1_linear_5_17" x1="404.419" y1="173.015" x2="257.482" y2="261.497" gradientUnits="userSpaceOnUse">
                    <stop offset=".182" stopColor="#fff" stopOpacity=".31" />
                    <stop offset=".715" stopColor="#fff" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="prefix__paint2_linear_5_17" x1="255.428" y1="89" x2="112.292" y2="342.802" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#fff" stopOpacity=".6" />
                    <stop offset=".667" stopColor="#fff" stopOpacity=".22" />
                  </linearGradient>
                  <clipPath id="prefix__clip0_5_17">
                    <path fill="#fff" d="M0 0h512v512H0z" />
                  </clipPath>
                  <clipPath id="prefix__clip1_5_17">
                    <path fill="#fff" transform="translate(85 89)" d="M0 0h343v334H0z" />
                  </clipPath>
                </defs>
              </svg>
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Cursor</p>
              <p className="text-xs text-muted-foreground">AI-native editor integration</p>
            </div>
            <Button
              variant={mcpInstalled["Cursor"] ? "outline" : "secondary"}
              className="w-full"
              disabled={mcpInstalled["Cursor"] || installing["Cursor"]}
              onClick={() => handleInstallMcp("Cursor")}
            >
              {mcpInstalled["Cursor"] ? "Installed" : installing["Cursor"] ? "Installing..." : "Install"}
            </Button>
          </Card>

          <Card className="flex flex-col items-center justify-between gap-4 border bg-background/70 p-6 text-center shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d97757]/10 text-[#d97757] shadow-sm ring-1 ring-[#d97757]/20">
              <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 fill-current">
                <path d="M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z" />
              </svg>
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Claude Code</p>
              <p className="text-xs text-muted-foreground">Anthropic's coding assistant</p>
            </div>
            <Button
              variant={mcpInstalled["Claude"] ? "outline" : "secondary"}
              className="w-full"
              disabled={mcpInstalled["Claude"] || installing["Claude"]}
              onClick={() => handleInstallMcp("Claude")}
            >
              {mcpInstalled["Claude"] ? "Installed" : installing["Claude"] ? "Installing..." : "Install"}
            </Button>
          </Card>

          <Card className="flex flex-col items-center justify-between gap-4 border bg-background/70 p-6 text-center shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#10a37f]/10 text-[#10a37f] shadow-sm ring-1 ring-[#10a37f]/20">
              <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 fill-current">
                <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
              </svg>
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Codex</p>
              <p className="text-xs text-muted-foreground">OpenAI's coding model</p>
            </div>
            <Button
              variant={mcpInstalled["Codex"] ? "outline" : "secondary"}
              className="w-full"
              disabled={mcpInstalled["Codex"] || installing["Codex"]}
              onClick={() => handleInstallMcp("Codex")}
            >
              {mcpInstalled["Codex"] ? "Installed" : installing["Codex"] ? "Installing..." : "Install"}
            </Button>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
