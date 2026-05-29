import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { getMcpInstallationDetails, type McpToolName } from "@/lib/mcp-installation-details";

interface McpConfigDetailsDialogProps {
  onExitComplete: () => void;
  onOpenChange: (tool: McpToolName | null) => void;
  openTool: McpToolName | null;
  snapshotTool: McpToolName | null;
}

export function McpConfigDetailsDialog({
  onExitComplete,
  onOpenChange,
  openTool,
  snapshotTool,
}: McpConfigDetailsDialogProps) {
  const details = snapshotTool ? getMcpInstallationDetails(snapshotTool) : null;

  return (
    <Dialog open={Boolean(openTool)} onOpenChange={(open) => !open && onOpenChange(null)}>
      <DialogContent className="max-w-xl" onExitComplete={onExitComplete}>
        <DialogHeader>
          <DialogTitle>Configuration Details</DialogTitle>
          <DialogDescription>{details?.description}</DialogDescription>
        </DialogHeader>
        {details && (
          <div className="grid gap-4 pt-2">
            {details.sections.map((section) => (
              <div className="grid gap-2" key={section.label}>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {section.label}
                </Label>
                <div className="rounded-md border bg-muted/30 p-3">
                  <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-relaxed">
                    {section.value}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
