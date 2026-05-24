import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export interface AppDialogStep {
  id: string;
  label: string;
}

interface AppDialogStepIndicatorProps {
  activeStepId: string;
  steps: AppDialogStep[];
}

export function AppDialogStepIndicator({
  activeStepId,
  steps,
}: AppDialogStepIndicatorProps) {
  const activeIndex = Math.max(
    steps.findIndex((step) => step.id === activeStepId),
    0,
  );

  return (
    <ol className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
      {steps.map((step, index) => {
        const isActive = index === activeIndex;
        const isComplete = index < activeIndex;

        return (
          <li key={step.id} className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-medium",
                isActive && "border-primary bg-primary text-primary-foreground",
                isComplete && "border-primary/30 bg-primary/10 text-primary",
              )}
            >
              {isComplete ? <Check className="h-3 w-3" /> : index + 1}
            </span>
            <span
              className={cn(
                "truncate",
                isActive && "font-medium text-foreground",
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
