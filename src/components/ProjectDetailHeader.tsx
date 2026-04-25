import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectDetailHeaderProps {
  name: string;
  path: string;
  onBack: () => void;
}

export const ProjectDetailHeader = ({
  name,
  path,
  onBack,
}: ProjectDetailHeaderProps) => (
  <div className="flex items-center gap-4">
    <Button variant="ghost" onClick={onBack} className="hover:bg-secondary">
      <ArrowLeft className="mr-2 h-4 w-4" />
      Back
    </Button>

    <div>
      <h1 className="text-3xl font-bold">{name}</h1>
      <code className="text-sm text-muted-foreground">{path}</code>
    </div>
  </div>
);
