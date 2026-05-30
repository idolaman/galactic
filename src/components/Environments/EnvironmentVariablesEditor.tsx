import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppToast } from "@/hooks/use-app-toast";
import { writeCodeWorkspace } from "@/services/workspace";
import { markWorkspaceRequiresRelaunch } from "@/services/workspace-state";
import type { Environment } from "@/types/environment";
interface EnvironmentVariablesEditorProps {
  environment: Environment;
  updateEnvironment: (id: string, updates: { envVars?: Record<string, string> }) => Promise<{ success: boolean; error?: string }>;
}

export function EnvironmentVariablesEditor({
  environment,
  updateEnvironment,
}: EnvironmentVariablesEditorProps) {
  const { error } = useAppToast();
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [newKey, setNewKey] = useState("");
  const [newProtocol, setNewProtocol] = useState("none");
  const [newSuffix, setNewSuffix] = useState("");
  useEffect(() => {
    setEnvVars(environment.envVars || {});
  }, [environment]);

  const saveConfig = async (vars: Record<string, string>) => {
    const result = await updateEnvironment(environment.id, { envVars: vars });
    if (!result.success) {
      error({ title: "Failed to update", description: result.error || "Unknown error." });
      return;
    }

    await Promise.all(
      environment.bindings.map(async (binding) => {
        await writeCodeWorkspace(binding.targetPath, {
          address: environment.address,
          envVars: vars,
        });
        markWorkspaceRequiresRelaunch(binding.targetPath);
      }),
    );
  };

  const handleAdd = () => {
    const key = newKey.trim();
    if (!key) return;
    if (Object.keys(envVars).some((entry) => entry.trim() === key)) {
      error({ title: "Variable exists", description: `Environment variable '${key}' already exists.` });
      return;
    }
    const protocolPrefix = newProtocol === "none" ? "" : `${newProtocol}://`;
    const next = { ...envVars, [key]: `${protocolPrefix}${environment.address}${newSuffix}` };
    setEnvVars(next);
    setNewKey("");
    setNewProtocol("none");
    setNewSuffix("");
    void saveConfig(next);
  };

  const handleRemove = (key: string) => {
    const next = { ...envVars };
    delete next[key];
    setEnvVars(next);
    void saveConfig(next);
  };

  return (
    <section className="rounded-md border bg-card">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Environment Variables</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Values save automatically and bound workspaces need relaunch after changes.
        </p>
      </div>
      <div className="grid gap-3 p-4">
        <div className="grid gap-2 lg:grid-cols-[minmax(8rem,1fr)_minmax(16rem,2fr)_auto]">
          <Input
            className="font-mono text-xs"
            placeholder="KEY"
            value={newKey}
            onChange={(event) => setNewKey(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && handleAdd()}
          />
          <div className="flex min-w-0 rounded-md border bg-background">
            <Select value={newProtocol} onValueChange={setNewProtocol}>
              <SelectTrigger className="h-10 w-24 rounded-r-none border-0 border-r text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="http">http://</SelectItem>
                <SelectItem value="https">https://</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center border-r bg-muted/40 px-2 font-mono text-xs text-muted-foreground">
              {environment.address}
            </div>
            <Input
              className="h-10 flex-1 rounded-l-none border-0 font-mono text-xs shadow-none focus-visible:ring-0"
              placeholder=":3000"
              value={newSuffix}
              onChange={(event) => setNewSuffix(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && handleAdd()}
            />
          </div>
          <Button size="icon" variant="secondary" onClick={handleAdd}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="overflow-hidden rounded-md border">
          {Object.entries(envVars).length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">No variables configured</div>
          ) : (
            Object.entries(envVars).map(([key, value]) => {
              return (
                <div key={key} className="grid grid-cols-[1fr_1fr_auto] items-center gap-3 border-b px-3 py-2 last:border-b-0">
                  <span className="truncate font-mono text-xs font-medium" title={key}>{key}</span>
                  <span className="truncate font-mono text-xs text-muted-foreground" title={value}>{value}</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleRemove(key)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
