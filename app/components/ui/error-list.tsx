import { ListOfErrors } from "~/utils/types";

export function ErrorList({
  id,
  errors,
}: {
  errors?: ListOfErrors;
  id?: string;
}) {
  const errorsToRender = errors?.filter(Boolean);
  if (!errorsToRender?.length) return null;
  return (
    <ul id={id} className="flex flex-col gap-1">
      {errorsToRender.map((e) => (
        <li
          key={e}
          className="pt-1 text-sm font-medium leading-none text-destructive"
        >
          {e}
        </li>
      ))}
    </ul>
  );
}
