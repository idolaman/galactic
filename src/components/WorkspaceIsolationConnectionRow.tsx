import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buildWorkspaceIsolationConnectionValue } from "@/lib/workspace-isolation-connection-targets";
import type {
  WorkspaceIsolationConnection,
  WorkspaceIsolationConnectionTarget,
} from "@/types/workspace-isolation";

interface WorkspaceIsolationConnectionRowProps {
  serviceId: string;
  connection: WorkspaceIsolationConnection;
  localTargets: WorkspaceIsolationConnectionTarget[];
  externalTargets: WorkspaceIsolationConnectionTarget[];
  onChangeConnection: (
    serviceId: string,
    connectionId: string,
    updates: Partial<WorkspaceIsolationConnection>,
  ) => void;
  onRemoveConnection: (serviceId: string, connectionId: string) => void;
}


const missingValue = (connectionId: string) => `__missing__:${connectionId}`;
const getTargetLabel = (target: WorkspaceIsolationConnectionTarget): string =>
  target.source === "local"
    ? target.serviceName || "Untitled Service"
    : `${target.projectName} / ${target.workspaceRootLabel} / ${target.serviceName}${target.enabled ? "" : " (Not enabled)"}`;

export const WorkspaceIsolationConnectionRow = ({
  serviceId,
  connection,
  localTargets,
  externalTargets,
  onChangeConnection,
  onRemoveConnection,
}: WorkspaceIsolationConnectionRowProps) => {
  const allTargets = [...localTargets, ...externalTargets];
  const selectedTarget = allTargets.find(
    (target) =>
      target.stackId === connection.targetStackId &&
      target.serviceId === connection.targetServiceId,
  );

  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2">
      <Input
        className="w-full sm:w-[180px] shrink-0 font-mono text-sm h-9"
        value={connection.envKey}
        onChange={(event) =>
          onChangeConnection(serviceId, connection.id, { envKey: event.target.value })
        }
        placeholder="UI_URL"
      />
      <div className="flex-1 min-w-0">
        <Select
          value={
            selectedTarget
              ? buildWorkspaceIsolationConnectionValue(
                  selectedTarget.stackId,
                  selectedTarget.serviceId,
                )
              : connection.targetStackId && connection.targetServiceId
                ? missingValue(connection.id)
                : undefined
          }
          onValueChange={(value) => {
            const [targetStackId, targetServiceId] = value.split(":");
            onChangeConnection(serviceId, connection.id, { targetStackId, targetServiceId });
          }}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Choose service" />
          </SelectTrigger>
          <SelectContent>
            {!selectedTarget && connection.targetStackId && connection.targetServiceId ? (
              <SelectItem value={missingValue(connection.id)} disabled>Missing target</SelectItem>
            ) : null}
            {localTargets.length > 0 ? (
              <SelectGroup>
                <SelectLabel>This Project</SelectLabel>
                {localTargets.map((target) => (
                  <SelectItem key={target.value} value={target.value}>
                    {getTargetLabel(target)}
                  </SelectItem>
                ))}
              </SelectGroup>
            ) : null}
            {externalTargets.length > 0 ? (
              <SelectGroup>
                <SelectLabel>Other Projects</SelectLabel>
                {externalTargets.map((target) => (
                  <SelectItem key={target.value} value={target.value}>
                    {getTargetLabel(target)}
                  </SelectItem>
                ))}
              </SelectGroup>
            ) : null}
          </SelectContent>
        </Select>
        {!selectedTarget && connection.targetStackId && connection.targetServiceId ? (
          <p className="mt-1 text-[10px] text-destructive">Missing target. Keep or replace this connection.</p>
        ) : null}
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={() => onRemoveConnection(serviceId, connection.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};
