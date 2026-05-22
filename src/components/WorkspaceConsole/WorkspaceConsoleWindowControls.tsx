import type { ReactNode } from "react";
import { Maximize2, Minimize2, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WorkspaceConsoleWindowControlsProps {
  expanded: boolean;
  onHide: () => void;
  onToggleSize: () => void;
}

interface WindowControlButtonProps {
  children: ReactNode;
  className: string;
  label: string;
  onClick: () => void;
}

const WindowControlButton = ({
  children,
  className,
  label,
  onClick,
}: WindowControlButtonProps) => (
  <Button
    variant="ghost"
    size="icon"
    aria-label={label}
    className="group h-7 w-7 rounded-md text-muted-foreground hover:bg-muted [&_svg]:size-2.5"
    onClick={onClick}
  >
    <span
      className={cn(
        "flex h-3.5 w-3.5 items-center justify-center rounded-full border shadow-sm",
        className,
      )}
    >
      {children}
    </span>
    <span className="sr-only">{label}</span>
  </Button>
);

export const WorkspaceConsoleWindowControls = ({
  expanded,
  onHide,
  onToggleSize,
}: WorkspaceConsoleWindowControlsProps) => {
  const SizeIcon = expanded ? Minimize2 : Maximize2;
  const sizeLabel = expanded ? "Dock console" : "Expand console";

  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-md bg-background/70 px-0.5">
      <WindowControlButton
        className="border-amber-500/50 bg-amber-400 text-amber-950"
        label="Minimize console"
        onClick={onHide}
      >
        <Minus className="h-2.5 w-2.5 opacity-80" />
      </WindowControlButton>
      <WindowControlButton
        className="border-emerald-600/50 bg-emerald-500 text-emerald-950"
        label={sizeLabel}
        onClick={onToggleSize}
      >
        <SizeIcon className="h-2.5 w-2.5 opacity-80" />
      </WindowControlButton>
    </div>
  );
};
