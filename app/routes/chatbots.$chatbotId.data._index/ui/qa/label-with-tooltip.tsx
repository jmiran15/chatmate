import { InfoCircledIcon } from "@radix-ui/react-icons";
import { ReactNode } from "react";
import { Label } from "~/components/ui/label";
import { CustomTooltip } from "./custom-tooltip";

interface LabelWithTooltipProps {
  htmlFor?: string;
  label: string;
  tooltip?: ReactNode;
}

export function LabelWithTooltip({
  htmlFor,
  label,
  tooltip,
}: LabelWithTooltipProps) {
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {tooltip && (
        <CustomTooltip content={tooltip}>
          <span role="button" tabIndex={0} className="cursor-default">
            <InfoCircledIcon className="h-4 w-4 text-muted-foreground" />
          </span>
        </CustomTooltip>
      )}
    </div>
  );
}
