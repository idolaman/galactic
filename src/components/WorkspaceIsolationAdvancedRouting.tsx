import { WorkspaceIsolationServiceProofCard } from "@/components/WorkspaceIsolationServiceProofCard";
import { useWorkspaceIsolationManager } from "@/hooks/use-workspace-isolation-manager";
import type { WorkspaceIsolationStack } from "@/types/workspace-isolation";

interface WorkspaceIsolationAdvancedRoutingProps {
  stack: WorkspaceIsolationStack;
}

export const WorkspaceIsolationAdvancedRouting = ({
  stack,
}: WorkspaceIsolationAdvancedRoutingProps) => {
  const { workspaceIsolationProjectTopologies, workspaceIsolationStacks } =
    useWorkspaceIsolationManager();

  return (
    <div className="grid gap-2.5">
      {stack.services.map((service) => (
        <WorkspaceIsolationServiceProofCard
          key={service.id}
          service={service}
          stack={stack}
          workspaceIsolationProjectTopologies={workspaceIsolationProjectTopologies}
          workspaceIsolationStacks={workspaceIsolationStacks}
        />
      ))}
    </div>
  );
};
