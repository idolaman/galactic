import { ArrowLeft, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectDetailHeaderProps {
  name: string;
  path: string;
  isGitRepo: boolean;
  onBack: () => void;
  onExportProjectConfig: () => void;
  onImportProjectConfig: () => void;
}

export const ProjectDetailHeader = ({
  name,
  path,
  isGitRepo,
  onBack,
  onExportProjectConfig,
  onImportProjectConfig,
}: ProjectDetailHeaderProps) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div className="flex min-w-0 items-center gap-4">
      <Button variant="ghost" onClick={onBack} className="hover:bg-secondary">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="min-w-0">
        <h1 className="text-3xl font-bold">{name}</h1>
        <code className="break-all text-sm text-muted-foreground">{path}</code>
      </div>
    </div>

    {isGitRepo ? (
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="outline" onClick={onImportProjectConfig}>
          <Upload className="mr-2 h-4 w-4" />
          Import
        </Button>
        <Button variant="outline" onClick={onExportProjectConfig}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>
    ) : null}
  </div>
);
