import { WorkspaceIsolationDialogBody } from "@/components/WorkspaceIsolationDialogBody";
import type { WorkspaceIsolationDialogStep } from "@/lib/workspace-isolation-dialog-step";
import type {
  WorkspaceIsolationProxyStatus,
  WorkspaceIsolationShellHookStatus,
} from "@/types/electron";
import type {
  WorkspaceActivationTarget,
  WorkspaceIsolationConnection,
  WorkspaceIsolationMode,
  WorkspaceIsolationProjectTopology,
  WorkspaceIsolationService,
  WorkspaceIsolationStack,
} from "@/types/workspace-isolation";

interface WorkspaceIsolationDialogBodyFrameProps {
  activationTargets: WorkspaceActivationTarget[];
  draftServices: WorkspaceIsolationService[];
  draftWorkspaceMode: WorkspaceIsolationMode;
  projectId: string;
  projectName: string;
  proxyStatus: WorkspaceIsolationProxyStatus;
  selectedActivationTargetPath: string | null;
  shellHookStatus: WorkspaceIsolationShellHookStatus | null;
  stackId: string;
  step: WorkspaceIsolationDialogStep;
  workspaceIsolationProjectTopologies: WorkspaceIsolationProjectTopology[];
  workspaceIsolationStacks: WorkspaceIsolationStack[];
  workspaceRootLabel: string;
  workspaceRootPath: string;
  onAddConnection: (serviceId: string) => void;
  onAddService: () => void;
  onChangeConnection: (
    serviceId: string,
    linkId: string,
    updates: Partial<WorkspaceIsolationConnection>,
  ) => void;
  onChangeService: (
    serviceId: string,
    updates: Partial<WorkspaceIsolationService>,
  ) => void;
  onRemoveConnection: (serviceId: string, linkId: string) => void;
  onRemoveService: (serviceId: string) => void;
  onSelectActivationTarget: (path: string) => void;
  onWorkspaceModeChange: (value: WorkspaceIsolationMode) => void;
}

export const WorkspaceIsolationDialogBodyFrame = (
  props: WorkspaceIsolationDialogBodyFrameProps,
) => (
  <div className="flex min-h-0 flex-1 px-5 py-4">
    <WorkspaceIsolationDialogBody {...props} />
  </div>
);
