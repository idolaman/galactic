import { useEffect, useMemo, useState } from "react";

import { EnvironmentCreateDialog } from "@/components/Environments/EnvironmentCreateDialog";
import { EnvironmentDeleteDialog } from "@/components/Environments/EnvironmentDeleteDialog";
import { EnvironmentDetailPanel } from "@/components/Environments/EnvironmentDetailPanel";
import { EnvironmentEmptyState } from "@/components/Environments/EnvironmentEmptyState";
import { EnvironmentListPane } from "@/components/Environments/EnvironmentListPane";
import { EnvironmentRenameDialog } from "@/components/Environments/EnvironmentRenameDialog";
import { useEnvironmentManager } from "@/hooks/use-environment-manager";
import { resolveSelectedEnvironmentId } from "@/lib/environment-selection";
import type { Environment } from "@/types/environment";

export default function Environments() {
  const {
    environments,
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
    unassignTarget,
  } = useEnvironmentManager();
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string | null>(
    () => environments[0]?.id ?? null,
  );
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [environmentToDelete, setEnvironmentToDelete] = useState<Environment | null>(null);

  useEffect(() => {
    const nextSelectedEnvironmentId = resolveSelectedEnvironmentId(
      selectedEnvironmentId,
      environments,
    );
    if (nextSelectedEnvironmentId !== selectedEnvironmentId) {
      setSelectedEnvironmentId(nextSelectedEnvironmentId);
    }
  }, [environments, selectedEnvironmentId]);

  const selectedEnvironment = useMemo(
    () => environments.find((environment) => environment.id === selectedEnvironmentId) ?? null,
    [environments, selectedEnvironmentId],
  );

  const handleEnvironmentCreated = (id: string) => {
    setSelectedEnvironmentId(id);
  };

  return (
    <div className="grid h-full min-h-0 grid-cols-1 overflow-hidden bg-background lg:grid-cols-[18rem_minmax(0,1fr)]">
      <EnvironmentListPane
        environments={environments}
        selectedId={selectedEnvironmentId}
        onCreateClick={() => setIsCreateDialogOpen(true)}
        onSelect={setSelectedEnvironmentId}
      />
      {selectedEnvironment ? (
        <EnvironmentDetailPanel
          environment={selectedEnvironment}
          updateEnvironment={updateEnvironment}
          unassignTarget={unassignTarget}
          onRename={() => setIsRenameDialogOpen(true)}
          onDelete={setEnvironmentToDelete}
        />
      ) : (
        <EnvironmentEmptyState onCreateClick={() => setIsCreateDialogOpen(true)} />
      )}
      <EnvironmentCreateDialog
        open={isCreateDialogOpen}
        environments={environments}
        createEnvironment={createEnvironment}
        onOpenChange={setIsCreateDialogOpen}
        onCreated={handleEnvironmentCreated}
      />
      <EnvironmentRenameDialog
        open={isRenameDialogOpen}
        environment={selectedEnvironment}
        environments={environments}
        updateEnvironment={updateEnvironment}
        onOpenChange={setIsRenameDialogOpen}
      />
      <EnvironmentDeleteDialog
        environment={environmentToDelete}
        deleteEnvironment={deleteEnvironment}
        onEnvironmentChange={setEnvironmentToDelete}
      />
    </div>
  );
}
