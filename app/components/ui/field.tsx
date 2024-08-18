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
}: {
  labelProps: React.LabelHTMLAttributes<HTMLLabelElement>;
  inputProps: React.InputHTMLAttributes<HTMLInputElement>;
  errors?: ListOfErrors;
  className?: string;
}) {
  const fallbackId = useId();
  const id = inputProps.id ?? fallbackId;
  const errorId = errors?.length ? `${id}-error` : undefined;
  return (
    <div className={className}>
      <Label htmlFor={id} {...labelProps} />
      <Input
        id={id}
        aria-invalid={errorId ? true : undefined}
        aria-describedby={errorId}
        {...inputProps}
      />
      {errorId ? (
        <div className="min-h-[32px] pt-1">
          <ErrorList id={errorId} errors={errors} />
        </div>
      ) : null}
    </div>
  );
}
