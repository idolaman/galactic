import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppToast } from "@/hooks/use-app-toast";
import { copyTextToClipboard } from "@/services/clipboard";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WorkspaceIsolationCopyButtonProps {
  text: string;
  label: string;
  successMessage?: string;
}

export const WorkspaceIsolationCopyButton = ({
  text,
  label,
  successMessage,
}: WorkspaceIsolationCopyButtonProps) => {
  const { error, success } = useAppToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const copied = await copyTextToClipboard(text);
    if (copied) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      success(successMessage ?? `${label} copied`);
      return;
    }

    error({
      title: "Copy failed",
      description: `Unable to copy the ${label}.`,
    });
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="relative h-6 w-6 shrink-0 text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground"
            onClick={handleCopy}
            aria-label={copied ? `${label} copied` : `Copy ${label}`}
          >
            <Check
              className={cn(
                "absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-primary transition-all duration-300",
                copied ? "scale-100 opacity-100 rotate-0" : "scale-50 opacity-0 -rotate-90"
              )}
            />
            <Copy
              className={cn(
                "absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 transition-all duration-300",
                copied ? "scale-50 opacity-0 rotate-90" : "scale-100 opacity-100 rotate-0"
              )}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {copied ? "Copied!" : `Copy ${label}`}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
