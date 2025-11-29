import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Environment } from "@/types/environment";

interface EnvironmentSelectorProps {
  environments: Environment[];
  value: string | null;
  targetLabel: string;
  onChange: (environmentId: string | null) => void;
  disabledReason?: string;
  minimal?: boolean;
}

export const EnvironmentSelector = ({
  environments,
  value,
  targetLabel,
  onChange,
  disabledReason,
  minimal = false,
}: EnvironmentSelectorProps) => {
  const isDisabled = !!disabledReason || environments.length === 0;
  const NONE_VALUE = "none";
  const selectedValue = value ?? NONE_VALUE;

  return (
    <div className="space-y-1.5">
      {!minimal && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Environment</span>
          {isDisabled && <span className="italic">{disabledReason ?? "Create an environment to attach."}</span>}
        </div>
      )}
      <Select
        value={selectedValue}
        disabled={isDisabled}
        onValueChange={(next) => onChange(next === NONE_VALUE ? null : next)}
      >
        <SelectTrigger className="w-full h-9 text-sm">
          <SelectValue placeholder="No environment" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE_VALUE}>No environment</SelectItem>
          {environments.map((environment) => (
            <SelectItem key={environment.id} value={environment.id}>
              {environment.name} — {environment.address}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!minimal && (
        <p className="text-[11px] text-muted-foreground">
          Only one workspace (or base code) per project can live in a given environment. Attach {targetLabel} to
          isolate its network ports.
        </p>
      )}
    </div>
  );
};
