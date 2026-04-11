import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { WorkspaceIsolationMode } from "@/types/workspace-isolation";

interface WorkspaceIsolationModeFieldProps {
  value: WorkspaceIsolationMode;
  onChange: (value: WorkspaceIsolationMode) => void;
}

export const WorkspaceIsolationModeField = ({
  value,
  onChange,
}: WorkspaceIsolationModeFieldProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border bg-card p-4 shadow-sm">
      <div className="grid gap-1">
        <Label className="text-base">Workspace Type</Label>
        <p className="text-xs text-muted-foreground max-w-sm">
          Choose whether this workspace has one root app or multiple service folders.
        </p>
      </div>

      <Tabs
        value={value}
        onValueChange={(nextValue) => onChange(nextValue as WorkspaceIsolationMode)}
        className="w-full sm:w-[300px]"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single-app">Single App</TabsTrigger>
          <TabsTrigger value="monorepo">Monorepo</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};
