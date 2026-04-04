import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ServiceStackConnectionsField } from "@/components/ServiceStackConnectionsField";
import type {
  ServiceStackConnection,
  ServiceStackEnvironment,
  ServiceStackService,
  ServiceStackWorkspaceMode,
} from "@/types/service-stack";

interface ServiceStackDialogServiceCardProps {
  projectId: string;
  projectName: string;
  workspaceRootPath: string;
  workspaceLabel: string;
  stackId: string;
  service: ServiceStackService;
  workspaceMode: ServiceStackWorkspaceMode;
  services: ServiceStackService[];
  serviceStacks: ServiceStackEnvironment[];
  step: 1 | 2;
  onChangeService: (serviceId: string, updates: Partial<ServiceStackService>) => void;
  onRemoveService: (serviceId: string) => void;
  onAddConnection: (serviceId: string) => void;
  onChangeConnection: (
    serviceId: string,
    linkId: string,
    updates: Partial<ServiceStackConnection>,
  ) => void;
  onRemoveConnection: (serviceId: string, linkId: string) => void;
}

export const ServiceStackDialogServiceCard = ({
  projectId,
  projectName,
  workspaceRootPath,
  workspaceLabel,
  stackId,
  service,
  workspaceMode,
  services,
  serviceStacks,
  step,
  onChangeService,
  onRemoveService,
  onAddConnection,
  onChangeConnection,
  onRemoveConnection,
}: ServiceStackDialogServiceCardProps) => {
  const pathValue = service.relativePath;
  const title =
    workspaceMode === "monorepo" && !pathValue ? "New Service" : service.name;
  const canRemoveService = step === 1 && (workspaceMode === "monorepo" || services.length > 1);

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex items-center justify-between border-b border-border/50 bg-muted/20 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="font-semibold">{title}</span>
        </div>
        {canRemoveService ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onRemoveService(service.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      <div className="grid gap-5 p-4">
        {step === 1 && workspaceMode === "monorepo" ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Label className="sm:w-32 shrink-0">Relative Folder</Label>
            <Input
              value={pathValue}
              onChange={(event) =>
                onChangeService(service.id, { relativePath: event.target.value })
              }
              placeholder="app/api"
              className="flex-1"
            />
          </div>
        ) : null}

        {step === 2 ? (
          <ServiceStackConnectionsField
            serviceId={service.id}
            projectId={projectId}
            projectName={projectName}
            workspaceRootPath={workspaceRootPath}
            workspaceLabel={workspaceLabel}
            stackId={stackId}
            connections={service.connections}
            services={services}
            serviceStacks={serviceStacks}
            onAddConnection={onAddConnection}
            onChangeConnection={onChangeConnection}
            onRemoveConnection={onRemoveConnection}
          />
        ) : null}
      </div>
    </div>
  );
};
