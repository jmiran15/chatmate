import { useId } from "react";
import { ListOfErrors } from "~/utils/types";
import { ErrorList } from "./error-list";
import { Input } from "./input";
import { Label } from "./label";

export function Field({
  labelProps,
  inputProps,
  errors,
  className,
  description,
}: {
  labelProps: React.LabelHTMLAttributes<HTMLLabelElement>;
  inputProps: React.InputHTMLAttributes<HTMLInputElement>;
  errors?: ListOfErrors;
  className?: string;
  description?: string;
}) {
  const fallbackId = useId();
  const id = inputProps.id ?? fallbackId;
  const errorId = errors?.length ? `${id}-error` : undefined;
  const descriptionId = description ? `${id}-description` : undefined;

  return (
    <div className={className}>
      <Label htmlFor={id} {...labelProps} />
      <Input
        id={id}
        aria-invalid={errorId ? true : undefined}
        aria-describedby={
          errorId && descriptionId
            ? `${errorId} ${descriptionId}`
            : errorId || descriptionId
        }
        {...inputProps}
      />
      {description ? (
        <p id={descriptionId} className="text-sm text-muted-foreground mt-1">
          {description}
        </p>
      ) : null}
      {errorId ? (
        <div className="min-h-[32px] pt-1">
          <ErrorList id={errorId} errors={errors} />
        </div>
      ) : null}
    </div>
  );
}
