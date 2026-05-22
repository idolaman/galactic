import { ArrowLeft, Download, FolderGit2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ProjectDetailHeaderProps {
  isGitRepo: boolean;
  name: string;
  onBack: () => void;
  onExportProjectConfig: () => void;
  onImportProjectConfig: () => void;
  path: string;
}

export const ProjectDetailHeader = ({
  isGitRepo,
  name,
  onBack,
  onExportProjectConfig,
  onImportProjectConfig,
  path,
}: ProjectDetailHeaderProps) => (
  <div className="border-b border-border pb-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="hidden h-5 w-px bg-border sm:block" />
        <FolderGit2 className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate text-xl font-semibold">{name}</h1>
          </div>
          <code className="block truncate text-xs text-muted-foreground" title={path}>
            {path}
          </code>
        </div>
      </div>

      {isGitRepo ? (
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" onClick={onImportProjectConfig}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={onExportProjectConfig}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      ) : null}
    </div>
  </div>
);
