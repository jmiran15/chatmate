import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "~/lib/utils";

// Custom Select component
export function CustomSelect({
  name,
  options,
  value,
  onChange,
  placeholder,
  handleFormChange,
}: {
  name: string;
  options: { id: string; name: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  handleFormChange: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedOption = options.find((option) => option.id === value);

  return (
    <div ref={selectRef} className="relative">
      <div
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          isOpen && "ring-2 ring-ring ring-offset-2",
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="line-clamp-1">
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover rounded-md border shadow-md">
          <div className="max-h-[200px] overflow-auto p-1">
            {options.map((option) => (
              <div
                key={option.id}
                className={cn(
                  "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                  option.id === value && "bg-accent text-accent-foreground",
                )}
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                  handleFormChange(); // Add this line
                }}
              >
                {option.id === value && (
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    <Check className="h-4 w-4" />
                  </span>
                )}
                {option.name}
              </div>
            ))}
          </div>
        </div>
      )}
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
