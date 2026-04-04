import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServiceStackConnectionRow } from "@/components/ServiceStackConnectionRow";
import { getConnectedServiceTargets } from "@/lib/service-stack-connection-targets";
import type { ServiceConnectionTarget, ServiceStackConnection, ServiceStackEnvironment, ServiceStackService } from "@/types/service-stack";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ServiceStackConnectionsFieldProps {
  serviceId: string;
  projectId: string;
  projectName: string;
  workspaceRootPath: string;
  workspaceLabel: string;
  stackId: string;
  connections: ServiceStackConnection[];
  services: ServiceStackService[];
  serviceStacks: ServiceStackEnvironment[];
  onAddConnection: (serviceId: string) => void;
  onChangeConnection: (
    serviceId: string,
    connectionId: string,
    updates: Partial<ServiceStackConnection>,
  ) => void;
  onRemoveConnection: (serviceId: string, connectionId: string) => void;
}

export const ServiceStackConnectionsField = ({
  serviceId,
  projectId,
  projectName,
  workspaceRootPath,
  workspaceLabel,
  stackId,
  connections,
  services,
  serviceStacks,
  onAddConnection,
  onChangeConnection,
  onRemoveConnection,
}: ServiceStackConnectionsFieldProps) => {
  const targetGroups = getConnectedServiceTargets({
    currentProjectId: projectId,
    currentProjectName: projectName,
    currentServiceId: serviceId,
    currentServices: services,
    currentStackId: stackId,
    currentWorkspaceLabel: workspaceLabel,
    currentWorkspaceRootPath: workspaceRootPath,
    serviceStacks,
  });
  const localTargets: ServiceConnectionTarget[] = targetGroups.localTargets;
  const externalTargets: ServiceConnectionTarget[] = targetGroups.externalTargets;

  const isConnectDisabled = localTargets.length + externalTargets.length === 0;

  return (
      <div className="pt-4 border-t border-border/40 grid gap-3">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h4 className="text-sm font-medium">Connected Services</h4>
            <p className="text-[11px] text-muted-foreground">
              Map environment variables to other services in this workspace or across Galactic projects.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {isConnectDisabled && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex h-5 w-5 cursor-help items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs text-center">
                    No other active services available. Add another service to this workspace or activate isolation in another project.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <Button
              size="sm"
              variant="ghost"
              className="shrink-0 h-7 px-2"
              onClick={() => onAddConnection(serviceId)}
              disabled={isConnectDisabled}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Connect
            </Button>
          </div>
        </div>

        {connections.length === 0 ? (
          <p className="text-xs text-muted-foreground">No connections configured yet.</p>
        ) : (
          <div className="grid gap-2">
            <div className="flex items-center gap-2 px-1 mb-1">
              <span className="w-[180px] shrink-0 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Env Key</span>
              <span className="flex-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Target Service</span>
            </div>
            {connections.map((connection) => (
              <ServiceStackConnectionRow
                key={connection.id}
                serviceId={serviceId}
                connection={connection}
                localTargets={localTargets}
                externalTargets={externalTargets}
                onChangeConnection={onChangeConnection}
                onRemoveConnection={onRemoveConnection}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

